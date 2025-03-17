import { appThemeAtom } from "@/atom/appThemeAtom";
import { configDIalogIsOpenAtom } from "@/atom/configDIalogIsOpenAtom";
import { useAtomValue, useSetAtom } from "jotai";
import { CircleX } from "lucide-react";
import { useEffect } from "react";
import { Flex, VStack, styled } from "styled-system/jsx";
import { AddOllamaHostField } from "./AddOllamaHostField";
import { ListOllamaHostField } from "./ListOllamaHostField";

const StyledConfigDialog = styled("dialog", {
	base: {
		margin: "auto",
		w: "90vw",
		borderRadius: "md",
		_scrollbarThumb: {
			borderRadius: "10px",
			border: "2px solid transparent",
			backgroundClip: "content-box",
		},
	},
	variants: {
		variants: {
			light: {
				color: "black",
				scrollbarColor: "#a9a9a9 #eeeeee",
				_scrollbarTrack: {
					backgroundColor: "#eeeeee",
				},
				_scrollbarThumb: {
					background: "#a9a9a9",
				},
			},
			dark: {
				color: "white",
				bg: "gray.700",
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
	defaultVariants: {
		variants: "light",
	},
});

type Props = {
	dialogRef: React.RefObject<HTMLDialogElement | null>;
};

export const ConfigDialogView = ({ dialogRef }: Props) => {
	const appTheme = useAtomValue(appThemeAtom);
	const setConfigDIalogIsOpen = useSetAtom(configDIalogIsOpenAtom);

	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	useEffect(() => {
		const handleCloseDialog = () => {
			setConfigDIalogIsOpen(false);
		};

		dialogRef.current?.addEventListener("close", handleCloseDialog);
	}, []);

	return (
		<StyledConfigDialog variants={appTheme} ref={dialogRef}>
			<VStack gap={8} p={"1em"}>
				<Flex w={"100%"} justify={"flex-end"}>
					<VStack gap={0}>
						<styled.button
							onClick={() => {
								dialogRef.current?.close();
							}}
						>
							<CircleX cursor="pointer" size={"28px"} />
						</styled.button>
						ESC
					</VStack>
				</Flex>
				<VStack gap={8} w={"100%"} alignItems={"flex-start"}>
					<AddOllamaHostField />
					<ListOllamaHostField />
				</VStack>
			</VStack>
		</StyledConfigDialog>
	);
};
