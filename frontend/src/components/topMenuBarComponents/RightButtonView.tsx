import { appThemeAtom } from "@/atom/appThemeAtom";
import { configDIalogIsOpenAtom } from "@/atom/configDIalogIsOpenAtom";
import type { AppThemeModel } from "@/model/configModel";
import hljs from "highlight.js";
import { useAtom, useSetAtom } from "jotai";
import { Moon, Settings, Sun } from "lucide-react";
import { useRef } from "react";
import { styled } from "styled-system/jsx";
import { UpdateAppTheme } from "wailsjs/go/main/App";
import { ConfigDialogView } from "../configDialogComponents/ConfigDialogView";

export const RightButtonView = () => {
	const [appTheme, setAppTheme] = useAtom(appThemeAtom);
	const setConfigDIalogIsOpen = useSetAtom(configDIalogIsOpenAtom);
	const dialogRef = useRef<HTMLDialogElement>(null);

	const switchAppTheme = () => {
		if (document.body.getAttribute("data-theme") === "light") {
			document.body.setAttribute("data-theme", "dark");
		} else {
			document.body.setAttribute("data-theme", "light");
		}
		const newAppTheme = document.body.getAttribute("data-theme");
		setAppTheme(newAppTheme as AppThemeModel);
		UpdateAppTheme(newAppTheme as string).then((data: string) => {
			if (data !== "") {
				console.error(data);
			}
		});
	};
	return (
		<>
			<styled.button
				cursor={"pointer"}
				onClick={() => {
					switchAppTheme();
					hljs.highlightAll();
				}}
			>
				{appTheme === "light" ? <Sun color="black" /> : <Moon color="white" />}
			</styled.button>

			<styled.button
				cursor={"pointer"}
				onClick={() => {
					setConfigDIalogIsOpen(true);
					dialogRef.current?.showModal();
				}}
			>
				<Settings color={appTheme === "light" ? "black" : "white"} />
			</styled.button>

			<ConfigDialogView dialogRef={dialogRef} />
		</>
	);
};
