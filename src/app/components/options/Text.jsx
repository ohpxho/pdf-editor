export default function Text() {
	return (
		<div className="flex flex-col gap-8 p-2 w-64">
			{/* Font Section */}
			<div>
				<div className="flex items-center justify-between cursor-pointer select-none">
					<span className="font-semibold text-base">Font</span>
					<svg width="20" height="20" className="ml-2" viewBox="0 0 20 20">
						<path
							d="M6 8l4 4 4-4"
							stroke="#222"
							strokeWidth="2"
							fill="none"
							strokeLinecap="round"
						/>
					</svg>
				</div>
				<div className="mt-3 flex flex-col gap-3">
					<div className="flex gap-2">
						<select className="border border-gray-200 rounded px-2 py-1 text-sm w-32 bg-white">
							<option>Helvetica</option>
							<option>Arial</option>
							<option>Times New Roman</option>
							<option>Courier</option>
						</select>
						<input
							type="number"
							min={6}
							max={72}
							value={10}
							readOnly
							className="w-12 h-8 border border-gray-200 rounded px-2 text-sm bg-white text-gray-700"
						/>
						<div className="flex items-center border border-gray-200 rounded px-2 h-8 bg-white">
							<input
								type="color"
								value="#000000"
								readOnly
								className="w-5 h-5 border-none p-0 bg-transparent"
								style={{ background: "none" }}
							/>
							<input
								type="text"
								value="#000000"
								readOnly
								className="w-16 ml-1 text-sm bg-transparent border-none"
							/>
						</div>
					</div>
					<div className="flex gap-2 mt-2">
						<button className="w-8 h-8 flex items-center justify-center rounded bg-white border border-gray-200 text-gray-700 font-bold">
							B
						</button>
						<button className="w-8 h-8 flex items-center justify-center rounded bg-white border border-gray-200 text-gray-700 italic">
							I
						</button>
						<button className="w-8 h-8 flex items-center justify-center rounded bg-white border border-gray-200 text-gray-700 underline">
							U
						</button>
						<button className="w-8 h-8 flex items-center justify-center rounded bg-white border border-gray-200 text-gray-700">
							<svg width="18" height="18" viewBox="0 0 20 20">
								<rect x="3" y="15" width="14" height="2" rx="1" fill="#888" />
								<rect x="7" y="5" width="6" height="2" rx="1" fill="#888" />
							</svg>
						</button>
					</div>
				</div>
			</div>
			{/* Paragraph Section */}
			<div>
				<div className="flex items-center justify-between cursor-pointer select-none">
					<span className="font-semibold text-base">Paragraph</span>
					<svg width="20" height="20" className="ml-2" viewBox="0 0 20 20">
						<path
							d="M6 8l4 4 4-4"
							stroke="#222"
							strokeWidth="2"
							fill="none"
							strokeLinecap="round"
						/>
					</svg>
				</div>
				<div className="mt-3 flex flex-col gap-3">
					<div className="flex gap-2">
						{/* Left align */}
						<button className="w-8 h-8 flex items-center justify-center rounded bg-red-100 border border-red-200">
							<svg width="18" height="18" viewBox="0 0 20 20">
								<rect x="3" y="5" width="14" height="2" rx="1" fill="#e57373" />
								<rect x="3" y="9" width="10" height="2" rx="1" fill="#e57373" />
								<rect x="3" y="13" width="8" height="2" rx="1" fill="#e57373" />
							</svg>
						</button>
						{/* Center align */}
						<button className="w-8 h-8 flex items-center justify-center rounded bg-white border border-gray-200">
							<svg width="18" height="18" viewBox="0 0 20 20">
								<rect x="3" y="5" width="14" height="2" rx="1" fill="#888" />
								<rect x="5" y="9" width="10" height="2" rx="1" fill="#888" />
								<rect x="6" y="13" width="8" height="2" rx="1" fill="#888" />
							</svg>
						</button>
						{/* Justify align */}
						<button className="w-8 h-8 flex items-center justify-center rounded bg-white border border-gray-200">
							<svg width="18" height="18" viewBox="0 0 20 20">
								<rect x="3" y="5" width="14" height="2" rx="1" fill="#888" />
								<rect x="3" y="9" width="14" height="2" rx="1" fill="#888" />
								<rect x="3" y="13" width="14" height="2" rx="1" fill="#888" />
							</svg>
						</button>
						{/* Right align */}
						<button className="w-8 h-8 flex items-center justify-center rounded bg-white border border-gray-200">
							<svg width="18" height="18" viewBox="0 0 20 20">
								<rect x="3" y="5" width="14" height="2" rx="1" fill="#888" />
								<rect x="7" y="9" width="10" height="2" rx="1" fill="#888" />
								<rect x="9" y="13" width="8" height="2" rx="1" fill="#888" />
							</svg>
						</button>
					</div>
					<div className="flex gap-2 mt-2">
						{/* Bulleted list */}
						<button className="w-8 h-8 flex items-center justify-center rounded bg-white border border-gray-200">
							<svg width="18" height="18" viewBox="0 0 20 20">
								<circle cx="6" cy="7" r="1.5" fill="#888" />
								<rect x="10" y="6" width="7" height="2" rx="1" fill="#888" />
								<circle cx="6" cy="13" r="1.5" fill="#888" />
								<rect x="10" y="12" width="7" height="2" rx="1" fill="#888" />
							</svg>
						</button>
						{/* Numbered list */}
						<button className="w-8 h-8 flex items-center justify-center rounded bg-white border border-gray-200">
							<svg width="18" height="18" viewBox="0 0 20 20">
								{/* 1 */}
								<text
									x="5"
									y="9.5"
									fontSize="4"
									fill="#888"
									fontFamily="Arial"
									fontWeight="bold"
								>
									1
								</text>
								<rect x="10" y="6" width="7" height="2" rx="1" fill="#888" />
								{/* 2 */}
								<text
									x="5"
									y="15.5"
									fontSize="4"
									fill="#888"
									fontFamily="Arial"
									fontWeight="bold"
								>
									2
								</text>
								<rect x="10" y="12" width="7" height="2" rx="1" fill="#888" />
							</svg>
						</button>
					</div>
				</div>
			</div>
			{/* Background Section */}
			<div className="mt-6">
				<div className="flex items-center justify-between cursor-pointer select-none">
					<span className="font-semibold text-base">Background</span>
					<svg width="20" height="20" className="ml-2" viewBox="0 0 20 20">
						<path
							d="M6 8l4 4 4-4"
							stroke="#222"
							strokeWidth="2"
							fill="none"
							strokeLinecap="round"
						/>
					</svg>
				</div>
				<div className="mt-3 flex flex-col gap-3">
					{/* Color Picker (disabled when transparent) */}
					<div className="flex items-center gap-2">
						<div className="w-7 h-7 rounded border border-gray-300 flex items-center justify-center bg-white">
							<div
								className="w-5 h-5 rounded"
								style={{ background: "#dededf" }}
							></div>
						</div>
						<input
							type="text"
							value="#dededf"
							readOnly
							disabled
							className="w-24 h-8 border border-gray-200 rounded px-2 text-sm bg-gray-100 text-gray-400"
						/>
					</div>
					{/* Transparent Checkbox */}
					<label className="flex items-center gap-2 cursor-pointer select-none mt-1">
						<input
							type="checkbox"
							checked={true}
							readOnly
							className="form-checkbox w-5 h-5 accent-black rounded border border-gray-300"
						/>
						<span className="text-base text-gray-900 font-medium">
							Transparent
						</span>
					</label>
				</div>
			</div>
		</div>
	);
}
