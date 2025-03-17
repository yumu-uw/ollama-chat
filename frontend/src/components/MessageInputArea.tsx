import { appThemeAtom } from "@/atom/appThemeAtom";
import { useAtomValue } from "jotai";
import { SendHorizontal } from "lucide-react";
import { useEffect, useRef } from "react";
import { Circle, Divider, Flex, VStack, styled } from "styled-system/jsx";

const MessageInputAreaVStack = styled(VStack, {
	base: {
		gap: 2,
		p: "0.5em",
		borderRadius: "lg",
	},
	variants: {
		variants: {
			light: {
				bg: "gray.200",
				color: "black",
			},
			dark: {
				bg: "gray.700",
				color: "white",
			},
		},
	},
	defaultVariants: {
		variants: "light",
	},
});

type Props = {
	input: string;
	setInput: React.Dispatch<React.SetStateAction<string>>;
	sendDisabled: boolean;
	callOllamaApi(): void;
};

export const MessageInputArea = ({
	input,
	setInput,
	sendDisabled,
	callOllamaApi,
}: Props) => {
	const appTheme = useAtomValue(appThemeAtom);
	const textareaRef = useRef<HTMLTextAreaElement>(null);

	// テキストエリアの高さを自動調節
	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	useEffect(() => {
		if (textareaRef.current) {
			textareaRef.current.style.height = "auto";
			textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
		}
	}, [input]);

	return (
		<MessageInputAreaVStack variants={appTheme}>
			<styled.textarea
				ref={textareaRef}
				w={"100%"}
				placeholder="送信するメッセージ(Enterで改行、Alt+Enterで送信)"
				resize={"none"}
				rows={1}
				maxHeight={240}
				outline={{ _focus: "none" }}
				value={input}
				onKeyDown={(e) => {
					if (e.key === "Enter" && e.altKey) {
						e.preventDefault();
						if (sendDisabled) {
							return;
						}
						callOllamaApi();
					}
				}}
				onChange={(e) => {
					setInput(e.target.value);
				}}
			/>
			<Divider />
			<Flex w={"100%"} justify={"flex-end"}>
				<styled.button
					cursor={"pointer"}
					onClick={callOllamaApi}
					disabled={sendDisabled}
				>
					<SendHorizontal color={appTheme === "light" ? "black" : "white"} />
				</styled.button>
			</Flex>
		</MessageInputAreaVStack>
	);
};
