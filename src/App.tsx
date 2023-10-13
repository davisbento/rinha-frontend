import { useCallback, useEffect, useRef, useState } from 'react';
import './App.css';

const validFormats = ['json'];

function App() {
	const [content, setContent] = useState<string>('');
	const offsetRef = useRef(0);
	const bufferRef = useRef(new Uint8Array());
	const [isBottom, setIsBottom] = useState(false);
	const [page, setPage] = useState(1);

	console.log('page: ', page);
	console.log('isBottom: ', isBottom);

	const readChunks = useCallback(() => {
		const buffer = bufferRef.current;
		const offset = offsetRef.current;

		// stop reading if we reached the end of the file
		if (offset >= buffer.length) return;

		const chunkSize = 1028 * 1028 * 0.2; // 0.2mb
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
				alert('Invalid file format');
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

			{content ? <div className='result'>{content}</div> : null}
		</div>
	);
}

export default App;
