/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useRef, useState } from 'react';
import './App.css';
import { parseJSON } from './services/jsonParser';

const validFormats = ['json'];

function App() {
	const [content, setContent] = useState<string>('');
	const offsetRef = useRef(0);
	const bufferRef = useRef(new Uint8Array());
	const [isBottom, setIsBottom] = useState(false);
	const [error, setError] = useState('');
	const [, setPage] = useState(1);

	const readChunks = useCallback(() => {
		const buffer = bufferRef.current;
		const offset = offsetRef.current;

		// stop reading if we reached the end of the file
		if (offset >= buffer.length) return;

		const chunkSize = 512; // 512 bytes
		const chunk = buffer.slice(offset, offset + chunkSize);
		offsetRef.current = offset + chunkSize;

		const text = new TextDecoder('utf-8').decode(chunk);
		setContent((prev) => prev + text);
		setIsBottom(false);
	}, []);

	const handleUpload = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			setContent('');
			const file = e.target.files?.[0];

			if (!file) return;

			const format = file.name.split('.').pop();
			if (!format || !validFormats.includes(format)) {
				setError('Invalid file format');
				return;
			}

			const fileReader = new FileReader();

			fileReader.onload = async function () {
				const buffer = new Uint8Array(fileReader.result as ArrayBuffer);

				bufferRef.current = buffer;

				readChunks();
			};

			fileReader.readAsArrayBuffer(file);

			// fileReader.onload = async function () {
			// 	const text = fileReader.result as string;
			// 	setContent(text);
			// };

			// fileReader.readAsText(file);
		},
		[readChunks]
	);

	const handleScroll = useCallback(() => {
		if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 100) {
			if (!isBottom) {
				setPage((prev) => prev + 1);
				setIsBottom(true);
				readChunks();
			}
		}
	}, [isBottom, readChunks]);

	const simpleValueRender = (value: any) => {
		if (typeof value === 'string') {
			return `"${value}"`;
		}

		if (typeof value === 'boolean') {
			return value ? 'true' : 'false';
		}

		return value ?? 'null';
	};

	const complexValueRender = (value: any) => {
		// check if its an array
		if (Array.isArray(value)) {
			return iterateOverArray(value);
		}

		return iterateOverObject(value, true);
	};

	const iterateOverObject = (obj: any, isChild: boolean) => {
		const keys = Object.keys(obj);

		return keys.map((key) => {
			const isArray = Array.isArray(obj[key]);

			return (
				<div
					key={key}
					className={isChild ? 'result-line-child' : 'result-line'}
					style={isArray ? { flexDirection: 'column', alignItems: 'flex-start' } : {}}
				>
					<div className='key'>
						{key}: {isArray ? <span className='brackets'> [</span> : null}
					</div>

					{obj[key] && typeof obj[key] === 'object' ? (
						<div className='value-obj'>{complexValueRender(obj[key])}</div>
					) : (
						<div className='value'>{simpleValueRender(obj[key])}</div>
					)}
				</div>
			);
		});
	};

	const iterateOverArray = (arr: any[]) => {
		const data = arr.map((item, idx) => {
			return item && typeof item === 'object' ? (
				<div className='array-column' key={idx}>
					<div className='array-idx'>{idx}: </div>
					{complexValueRender(item)}
				</div>
			) : (
				<div className='array-line' key={idx}>
					<div className='array-idx'>{idx}: </div>
					{simpleValueRender(item)}
				</div>
			);
		});

		return (
			<div className='array'>
				{data}
				<span className='brackets'>]</span>
			</div>
		);
	};

	const getContent = () => {
		if (!content) return null;

		try {
			const json = parseJSON(content);
			return iterateOverObject(json, false);
		} catch (e) {
			// valid if the json is not complete
			if (e instanceof SyntaxError) {
				// setError('Invalid JSON');
				return null;
			}
		}
	};

	useEffect(() => {
		window.addEventListener('scroll', handleScroll);

		return () => window.removeEventListener('scroll', handleScroll);
	}, [handleScroll]);

	return (
		<div className='container'>
			<div>
				<h1>JSON Tree Viewer</h1>
				<p>Simple JSON Viewer that runs completely on-client. No data exchange </p>
			</div>

			<div className='buttons'>
				<label htmlFor='fileInput'>Load json</label>
				<input type='file' name='fileInput' id='fileInput' onChange={handleUpload} />
			</div>

			{error ? <div className='error'>{error}</div> : null}

			{content ? <div className='result'>{getContent()}</div> : null}
		</div>
	);
}

export default App;
