package ymuwutil

import (
	"encoding/json"
	"ollama-chat/pkg/model"
	"os"
	"os/user"
	"path"
	"runtime"
)

var configDir string
var configFile string

func SetupConfigDir() error {
	user, err := user.Current()
	if err != nil {
		return err
	}

	if runtime.GOOS == "windows" {
		configDir = path.Join(os.Getenv("LOCALAPPDATA"), "YmuwApps", "ollama-chat")
	} else if runtime.GOOS == "darwin" {
		configDir = path.Join(user.HomeDir, "Library/Application Support/YmuwApps/ollama-chat")
	} else {
		configDir = user.HomeDir
	}

	// 設定ファイル保存ディレクトリの作成
	os.MkdirAll(configDir, os.ModePerm)
	return nil
}

func GetConfigDir() string {
	return configDir
}

func CreateTemplateConfigJson() error {
	configFile = path.Join(configDir, "config.json")
	if _, err := os.Stat(configFile); err == nil {
		return nil
	}
	// ファイル作成
	file, err := os.OpenFile(configFile, os.O_RDWR|os.O_CREATE, 0666)
	if err != nil {
		return err
	}
	defer file.Close()

	encoder := json.NewEncoder(file)
	config := model.ConfigJson{
		AppTheme:                  "light",
		OllamaEndpoints:           []model.OllamaEndpoint{},
		DefaultOllamaEndPointName: "",
	}

	if err := encoder.Encode(config); err != nil {
		return err
	}
	return nil
}

func LoadConfigJson() (model.ConfigJson, error) {
	var config model.ConfigJson
	f, err := os.Open(configFile)
	if err != nil {
		panic(err)
	}
	defer f.Close()
	parser := json.NewDecoder(f)
	parser.Decode(&config)
	return config, nil
}

func UpdateConfigJson(newConfig model.ConfigJson) error {
	jsonData, err := json.MarshalIndent(newConfig, "", "  ")
	if err != nil {
		return err
	}

	file, err := os.Create(configFile)
	if err != nil {
		return err
	}
	defer file.Close()

	_, err = file.Write(jsonData)
	if err != nil {
		return err
	}
	return nil
}

func CreateErrorMessage(err error) string {
	return "error: " + err.Error()
}
