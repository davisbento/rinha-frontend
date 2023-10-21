import untruncateJson from 'untruncate-json';

const parseIncompleteJSON = (incompleteJSON: string) => {
	return untruncateJson(incompleteJSON);
};

export const parseJSON = (incompleteJSON: string) => {
	try {
		const parsed = JSON.parse(incompleteJSON);
		return parsed;
	} catch (error) {
		if (error instanceof SyntaxError) {
			const parsed = parseIncompleteJSON(incompleteJSON);
			return JSON.parse(parsed);
		}
	}
};
