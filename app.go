package main

import (
	"bufio"
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"

	"ollama-chat/pkg/model"

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
	data := model.RequestData{
		Model:    ollamaModel,
		Messages: chatHistory,
		Stream:   true,
	}

	jsonData, err := json.Marshal(data)
	if err != nil {
		return err.Error()
	}

	req, err := http.NewRequest("POST", ollamaURL+"/api/chat", bytes.NewBuffer(jsonData))
	if err != nil {
		return err.Error()
	}
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return err.Error()
	}
	defer resp.Body.Close()

	var output string

	scanner := bufio.NewScanner(resp.Body)
	for scanner.Scan() {
		for _, v := range strings.Split(scanner.Text(), "\n") {
			var obj model.ResponseData
			if err := json.Unmarshal([]byte(v), &obj); err != nil {
				panic(err)
			}
			output += obj.Message.Content
			runtime.EventsEmit(a.ctx, "receiveChat", v)
		}
	}

	if err := scanner.Err(); err != nil {
		fmt.Println("Error reading response:", err)
		panic(err)
	}
	runtime.EventsEmit(a.ctx, "deleteEvent", output)
	return ""
}
