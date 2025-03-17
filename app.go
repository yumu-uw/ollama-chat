package main

import (
	"bufio"
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"strings"

	"ollama-chat/pkg/model"
	ymuwutil "ollama-chat/pkg/ymuw-util"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// App struct
type App struct {
	ctx    context.Context
	config model.ConfigJson
}

// NewApp creates a new App application struct
func NewApp(config model.ConfigJson) *App {
	return &App{
		config: config,
	}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

func (a *App) GetConfig() model.ConfigJson {
	return a.config
}

func (a *App) SendChat(ollamaURL string, ollamaModel string, chatHistory []model.Chat) string {
	data := model.ChatApiRequestData{
		Model:    ollamaModel,
		Messages: chatHistory,
		Stream:   true,
	}

	jsonData, err := json.Marshal(data)
	if err != nil {
		return ymuwutil.CreateErrorMessage(err)
	}

	req, err := http.NewRequest("POST", ollamaURL+"/api/chat", bytes.NewBuffer(jsonData))
	if err != nil {
		return ymuwutil.CreateErrorMessage(err)
	}
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return ymuwutil.CreateErrorMessage(err)
	}
	defer resp.Body.Close()

	var output string

	scanner := bufio.NewScanner(resp.Body)
	for scanner.Scan() {
		for _, v := range strings.Split(scanner.Text(), "\n") {
			var obj model.ChatApiResponseData
			if err := json.Unmarshal([]byte(v), &obj); err != nil {
				panic(err)
			}
			output += obj.Message.Content
			runtime.EventsEmit(a.ctx, "receiveChat", v)
		}
	}

	if err := scanner.Err(); err != nil {
		runtime.EventsEmit(a.ctx, "deleteEvent", output)
		return ymuwutil.CreateErrorMessage(err)
	}
	runtime.EventsEmit(a.ctx, "deleteEvent", output)
	return ""
}

func (a *App) GetOllamaModels(ollamaURL string) string {
	resp, err := http.Get(ollamaURL + "/api/tags")
	if err != nil {
		return ymuwutil.CreateErrorMessage(err)
	}
	defer resp.Body.Close()

	var data model.TagApiResponse
	if err := json.NewDecoder(resp.Body).Decode(&data); err != nil {
		return ymuwutil.CreateErrorMessage(err)
	}

	var models []string
	for _, v := range data.Models {
		models = append(models, string(v.Name))
	}

	return strings.Join(models, ",")
}

func (a *App) GetModels() string {
	return a.config.AppTheme
}

func (a *App) UpdateAppTheme(newAppTheme string) string {
	a.config.AppTheme = newAppTheme
	if err := ymuwutil.UpdateConfigJson(a.config); err != nil {
		return ymuwutil.CreateErrorMessage(err)
	}
	return ""
}

func (a *App) UpdateOllamaEndpoints(newOllamaEndpoints []model.OllamaEndpoint) string {
	a.config.OllamaEndpoints = newOllamaEndpoints
	if err := ymuwutil.UpdateConfigJson(a.config); err != nil {
		return ymuwutil.CreateErrorMessage(err)
	}
	return ""
}

func (a *App) UpdateDefaultOllamaEndPointName(name string) string {
	a.config.DefaultOllamaEndPointName = name
	if err := ymuwutil.UpdateConfigJson(a.config); err != nil {
		return ymuwutil.CreateErrorMessage(err)
	}
	return ""
}
