export const deepCopyObject = <T>(obj: T): T => {
	return JSON.parse(JSON.stringify(obj));
};

export const isError = (s: string): boolean => {
	return s.startsWith("error:");
};
