import { appThemeAtom } from "@/atom/appThemeAtom";
import { configAtom } from "@/atom/configAtom";
import { configDIalogIsOpenAtom } from "@/atom/configDIalogIsOpenAtom";
import { currentOllamaHostAtom } from "@/atom/currentOllamaHostAtom";
import { deepCopyObject } from "@/lib/util";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { useEffect, useState } from "react";
import { Box, VStack, styled } from "styled-system/jsx";
import {
	GetOllamaModels,
	UpdateDefaultOllamaEndPointName,
	UpdateOllamaEndpoints,
} from "wailsjs/go/main/App";
import type { model } from "wailsjs/go/models";
import { z } from "zod";

const DisplayNameScheme = z.string().nonempty();
const OllamaHostScheme = z.string().url();

export const AddOllamaHostField = () => {
	const appTheme = useAtomValue(appThemeAtom);
	const [config, setConfig] = useAtom(configAtom);
	const configDialogIsOpen = useAtomValue(configDIalogIsOpenAtom);
	const setCurrentOllamaHost = useSetAtom(currentOllamaHostAtom);
	const setConfigDIalogIsOpen = useSetAtom(configDIalogIsOpenAtom);

	const [displayName, setDisplayName] = useState("");
	const [ollamaHost, setOllamaHost] = useState("");

	const [displayNameEerrorMessage, setDisplayNameEerrorMessage] = useState("");
	const [hostErrorMessage, setHostErrorMessage] = useState("");

	const handleSubmit = async () => {
		let newDisplayNameErrorMessage = "";
		let newHostErrorMessage = "";
		if (!DisplayNameScheme.safeParse(displayName).success) {
			newDisplayNameErrorMessage = "DisplayName can't be empty";
			setDisplayNameEerrorMessage(newDisplayNameErrorMessage);
		} else {
			newDisplayNameErrorMessage = "";
			setDisplayNameEerrorMessage("");
		}

		if (!OllamaHostScheme.safeParse(ollamaHost).success) {
			newHostErrorMessage = "OllamaHost format is invalid";
			setHostErrorMessage(newHostErrorMessage);
		} else {
			newHostErrorMessage = "";
			setHostErrorMessage("");
		}

		if (newDisplayNameErrorMessage !== "" || newHostErrorMessage !== "") {
			return;
		}
		setDisplayNameEerrorMessage("");
		setHostErrorMessage("");

		for (const endpoint of config?.OllamaEndpoints ?? []) {
			if (endpoint.EndpointName === displayName) {
				alert("DisplayName is already registered");
				return;
			}
		}

		const data = await GetOllamaModels(ollamaHost);
		if (data.startsWith("error:")) {
			return;
		}

		const models: string[] = [];
		data.split(",").map((v) => {
			models.push(v);
		});

		const newOllamaEndpoint: model.OllamaEndpoint = {
			EndpointName: displayName,
			EndpointUrl: ollamaHost,
			LLMModels: models,
			DefaultLLMModel: models.length > 0 ? models[0] : "",
		};

		if (config?.OllamaEndpoints.length === 0) {
			handleInitSetting(newOllamaEndpoint);
		} else {
			handleAddOllamaHost(newOllamaEndpoint);
		}
		setDisplayName("");
		setOllamaHost("");
		setDisplayNameEerrorMessage("");
		setHostErrorMessage("");
	};

	const handleInitSetting = async (newOllamaEndpoint: model.OllamaEndpoint) => {
		const newConfig = deepCopyObject(config);
		if (!newConfig) {
			return;
		}
		newConfig.OllamaEndpoints.push(newOllamaEndpoint);
		newConfig.DefaultOllamaEndPointName = newOllamaEndpoint.EndpointName;

		setConfig(newConfig);
		await UpdateOllamaEndpoints(newConfig?.OllamaEndpoints || []);
		await UpdateDefaultOllamaEndPointName(newOllamaEndpoint.EndpointName);
		if (newConfig.OllamaEndpoints.length === 1) {
			setCurrentOllamaHost({
				DisplayName: newOllamaEndpoint.EndpointName,
				Endpoint: newOllamaEndpoint.EndpointUrl,
				ModelName: newOllamaEndpoint.DefaultLLMModel,
			});
			setConfigDIalogIsOpen(false);
		}
	};

	const handleAddOllamaHost = async (
		newOllamaEndpoint: model.OllamaEndpoint,
	) => {
		const newConfig = deepCopyObject(config);
		newConfig?.OllamaEndpoints.push(newOllamaEndpoint);
		if (newConfig?.OllamaEndpoints.length === 1) {
			newConfig.DefaultOllamaEndPointName = newOllamaEndpoint.EndpointName;
		}
		setConfig(newConfig);
		await UpdateOllamaEndpoints(newConfig?.OllamaEndpoints || []);
	};

	useEffect(() => {
		if (!configDialogIsOpen) {
			setDisplayName("");
			setOllamaHost("");
			setDisplayNameEerrorMessage("");
			setHostErrorMessage("");
		}
	}, [configDialogIsOpen]);

	return (
		<VStack
			p={"1em"}
			w={"100%"}
			alignItems={"flex-start"}
			border={"1px solid"}
			borderColor={appTheme === "light" ? "black" : "gray.400"}
			borderRadius={"2xl"}
		>
			<styled.h2 fontSize={"2xl"} fontWeight={"extrabold"} pb={"1em"}>
				Add Ollama Host
			</styled.h2>
			<VStack w={"100%"} alignItems={"flex-start"}>
				<label htmlFor={"display-name"}>DisplayName</label>
				<styled.input
					id="display-name"
					type="text"
					p={"0.3em"}
					w={"100%"}
					placeholder="e.g. Ollama localhost"
					border={"1px solid"}
					borderColor={appTheme === "light" ? "black" : "gray.400"}
					borderRadius={"md"}
					value={displayName}
					onChange={(e) => setDisplayName(e.target.value)}
				/>
				{displayNameEerrorMessage !== "" && (
					<styled.p color={"red"}>{displayNameEerrorMessage}</styled.p>
				)}
			</VStack>

			<VStack w={"100%"} alignItems={"flex-start"}>
				<label htmlFor={"endpoint-url"}>OllamaHost</label>
				<styled.input
					id="endpoint-url"
					type="text"
					p={"0.3em"}
					w={"100%"}
					placeholder="e.g. http://localhost:11434"
					border={"1px solid"}
					borderColor={appTheme === "light" ? "black" : "gray.400"}
					borderRadius={"md"}
					value={ollamaHost}
					onChange={(e) => setOllamaHost(e.target.value)}
				/>
				{hostErrorMessage !== "" && (
					<styled.p color={"red"}>{hostErrorMessage}</styled.p>
				)}
			</VStack>

			<Box w={"100%"} textAlign={"center"}>
				<styled.button
					cursor={"pointer"}
					p={"0.5em"}
					border={"1px solid"}
					borderColor={appTheme === "light" ? "black" : "gray.400"}
					borderRadius={"md"}
					onClick={handleSubmit}
				>
					Add Ollama Host
				</styled.button>
			</Box>
		</VStack>
	);
};
