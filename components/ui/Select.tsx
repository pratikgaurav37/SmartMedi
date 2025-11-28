import { ChevronLeft } from 'lucide-react';
import React from 'react';

export const Select: React.FC<
	React.SelectHTMLAttributes<HTMLSelectElement> & { label: string }
> = ({ label, children, className = "", ...props }) => (
	<div className="w-full">
		<label className="block text-sm font-medium text-slate-700 mb-1.5">
			{label}
		</label>
		<div className="relative">
			<select
				className={`w-full appearance-none px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all ${className}`}
				{...props}
			>
				{children}
			</select>
			<div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
				<ChevronLeft className="w-4 h-4 -rotate-90" />
			</div>
		</div>
	</div>
);