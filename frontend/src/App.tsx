import { useEffect, useRef, useState } from "react";
import { Box, Container, Flex, styled } from "styled-system/jsx";
import "./css/github-markdown.css";
import { useAtom, useSetAtom } from "jotai";
import { GetConfig, SendChat } from "wailsjs/go/main/App";
import { EventsOff, EventsOn, EventsOnce } from "wailsjs/runtime/runtime";
import { appThemeAtom } from "./atom/appThemeAtom";
import { configAtom } from "./atom/configAtom";
import { configDIalogIsOpenAtom } from "./atom/configDIalogIsOpenAtom";
import { currentOllamaHostAtom } from "./atom/currentOllamaHostAtom";
import { MessageInputArea } from "./components/MessageInputArea";
import { ChatView } from "./components/chatViewComponents/ChatView";
import { MarkdownView } from "./components/chatViewComponents/MarkdownView";
import { UserMessageView } from "./components/chatViewComponents/UserMessageView";
import { ConfigDialogView } from "./components/configDialogComponents/ConfigDialogView";
import { TopMenuBar } from "./components/topMenuBarComponents/TopMenuBar";
import type { ConfigModel } from "./model/configModel";
import type { Chat, ResponseData } from "./model/dataModels";

const ChatViewWrapperBox = styled(Box, {
	base: {
		marginEnd: "auto",
		overflow: "auto",
		w: "100%",
		h: "100%",
		pr: "0.5em",
		_scrollbarThumb: {
			borderRadius: "10px",
			border: "2px solid transparent",
			backgroundClip: "content-box",
		},
	},
	variants: {
		variants: {
			light: {
				scrollbarColor: "#a9a9a9 #eeeeee",
				_scrollbarTrack: {
					backgroundColor: "#eeeeee",
				},
				_scrollbarThumb: {
					background: "#a9a9a9",
				},
			},
			dark: {
				scrollbarColor: "#3D3C3B #1D2A39",
				_scrollbarTrack: {
					backgroundColor: "#000000",
				},
				_scrollbarThumb: {
					background: "#3D3C3B",
				},
			},
		},
	},
});

function App() {
	const [appTheme, setAppTheme] = useAtom(appThemeAtom);
	const setConfig = useSetAtom(configAtom);
	const [currentOllamaHost, setCurrentOllamaHost] = useAtom(
		currentOllamaHostAtom,
	);
	const setConfigDIalogIsOpen = useSetAtom(configDIalogIsOpenAtom);

	const [input, setInput] = useState("");
	const [prevInput, setPrevInput] = useState("");
	const [sendDisabled, setSendDisabled] = useState(false);
	const [ollamaResopnse, setOllamaResopnse] = useState("");
	const [chatHistory, setChatHistory] = useState<Chat[]>([
		{
			role: "system",
			content:
				"You are a helpful, respectful and honest coding assistant. Always reply using markdown. Be clear and concise, prioritizing brevity in your responses.",
		},
	]);

	const chatRef = useRef<HTMLDivElement>(null);
	const dialogRef = useRef<HTMLDialogElement>(null);

	// 設定ファイルの情報を取得
	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	useEffect(() => {
		GetConfig().then((data) => {
			switch (data.AppTheme) {
				case "light":
					setAppTheme("light");
					break;
				case "dark":
					setAppTheme("dark");
					break;
				default:
					setAppTheme("light");
					break;
			}
			document.body.setAttribute("data-theme", data.AppTheme);
			const newConfig: ConfigModel = {
				OllamaEndpoints: data.OllamaEndpoints,
				DefaultOllamaEndPointName: data.DefaultOllamaEndPointName,
			};
			setConfig(newConfig);

			if (newConfig.OllamaEndpoints.length === 0) {
				setTimeout(() => {
					setConfigDIalogIsOpen(true);
					dialogRef.current?.showModal();
				}, 500);
				return;
			}

			for (const endpoint of newConfig.OllamaEndpoints || []) {
				if (endpoint.EndpointName === newConfig.DefaultOllamaEndPointName) {
					setCurrentOllamaHost({
						DisplayName: endpoint.EndpointName,
						Endpoint: endpoint.EndpointUrl,
						ModelName: endpoint.DefaultLLMModel,
					});
					break;
				}
			}
		});
	}, []);

	// チャットエリアを自動でスクロール
	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	useEffect(() => {
		if (chatRef.current) {
			chatRef.current.scrollTop = chatRef.current.scrollHeight;
		}
	}, [ollamaResopnse]);

	function callOllamaApi() {
		if (input === "") {
			return;
		}
		setSendDisabled(true);
		const msg = input;
		setPrevInput(msg);
		setInput("");
		EventsOn("receiveChat", (data: string) => {
			data.split(/\r?\n/).map((v) => {
				if (v !== "") {
					const j = JSON.parse(v) as ResponseData;
					setOllamaResopnse((prev) => prev + j.message.content);
				}
			});
		});

		EventsOnce("deleteEvent", (output: string) => {
			const newMessages: Chat[] = [
				...chatHistory,
				{
					role: "user",
					content: msg,
				},
				{
					role: "assistant",
					content: output,
				},
			];
			setPrevInput("");
			setOllamaResopnse("");
			setChatHistory(newMessages);
			setSendDisabled(false);
			EventsOff("receiveChat");
		});

		SendChat(
			currentOllamaHost?.Endpoint as string,
			currentOllamaHost?.ModelName as string,
			[
				...chatHistory,
				{
					role: "user",
					content: msg,
				},
			],
		);
	}

	return (
		<Container>
			<Flex
				direction={"column"}
				gap={"8"}
				h={"100vh"}
				w={"100%"}
				padding={"1em"}
				justify={"space-between"}
			>
				<TopMenuBar />
				<ChatViewWrapperBox variants={appTheme} ref={chatRef}>
					<ChatView chatHistory={chatHistory} />
					{prevInput && <UserMessageView message={prevInput} />}
					{ollamaResopnse !== "" && <MarkdownView mdStr={ollamaResopnse} />}
				</ChatViewWrapperBox>
				<MessageInputArea
					input={input}
					setInput={setInput}
					sendDisabled={sendDisabled}
					callOllamaApi={callOllamaApi}
				/>
			</Flex>

			<ConfigDialogView dialogRef={dialogRef} />
		</Container>
	);
}

export default App;
