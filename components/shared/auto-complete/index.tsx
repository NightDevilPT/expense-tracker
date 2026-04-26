// components/shared/auto-complete/index.tsx
"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";

// ============================================
// TYPES
// ============================================

export interface AutoCompleteOption {
	value: string;
	label: string;
	description?: string;
	color?: string;
	disabled?: boolean;
}

export interface AutoCompleteProps {
	options?: AutoCompleteOption[];
	fetchFn?: (
		query: string,
		signal?: AbortSignal,
	) => Promise<AutoCompleteOption[]>;
	debounceMs?: number;
	value?: string;
	onValueChange?: (value: string, option?: AutoCompleteOption) => void;
	placeholder?: string;
	searchPlaceholder?: string;
	emptyMessage?: string;
	renderOption?: (option: AutoCompleteOption) => React.ReactNode;
	disabled?: boolean;
	clearable?: boolean;
	name?: string;
	className?: string;
	// Add to AutoCompleteProps interface:
	initialOption?: AutoCompleteOption;
}

// ============================================
// DEFAULT RENDER
// ============================================

function DefaultOption({ option }: { option: AutoCompleteOption }) {
	return (
		<div className="flex items-center gap-2">
			{option.color && (
				<div
					className="w-3 h-3 rounded-full flex-shrink-0"
					style={{ backgroundColor: option.color }}
				/>
			)}
			<div className="flex flex-col">
				<span>{option.label}</span>
				{option.description && (
					<span className="text-xs text-muted-foreground">
						{option.description}
					</span>
				)}
			</div>
		</div>
	);
}

// ============================================
// COMPONENT
// ============================================

export function AutoComplete({
	options: staticOptions = [],
	fetchFn,
	debounceMs = 300,
	value: controlledValue,
	onValueChange,
	placeholder = "Select...",
	searchPlaceholder = "Search...",
	emptyMessage = "No results found.",
	renderOption,
	disabled = false,
	clearable = true,
	name,
	className,
	initialOption,
}: AutoCompleteProps) {
	const [open, setOpen] = React.useState(false);
	const [internalValue, setInternalValue] = React.useState("");
	const [searchQuery, setSearchQuery] = React.useState("");
	const [asyncOptions, setAsyncOptions] = React.useState<
		AutoCompleteOption[]
	>([]);
	const [isLoading, setIsLoading] = React.useState(false);

	const debounceRef = React.useRef<NodeJS.Timeout>(undefined);
	const abortRef = React.useRef<AbortController>(undefined);

	const value = controlledValue ?? internalValue;

	const options = React.useMemo(() => {
		if (fetchFn) return asyncOptions;
		if (!searchQuery) return staticOptions;
		const q = searchQuery.toLowerCase();
		return staticOptions.filter(
			(opt) =>
				opt.label.toLowerCase().includes(q) ||
				opt.value.toLowerCase().includes(q) ||
				opt.description?.toLowerCase().includes(q),
		);
	}, [staticOptions, asyncOptions, searchQuery, fetchFn]);

	// Replace the selectedOption useMemo with:
	const selectedOption = React.useMemo(() => {
		const found = [...staticOptions, ...asyncOptions].find(
			(o) => o.value === value,
		);
		if (found) return found;
		if (initialOption && initialOption.value === value)
			return initialOption;
		return undefined;
	}, [staticOptions, asyncOptions, value, initialOption]);

	// ============================================
	// ASYNC FETCH
	// ============================================

	const fetchOptions = React.useCallback(
		async (query: string) => {
			if (!fetchFn) return;
			abortRef.current?.abort();
			const controller = new AbortController();
			abortRef.current = controller;
			setIsLoading(true);
			try {
				const results = await fetchFn(query, controller.signal);
				setAsyncOptions(results);
			} catch (err) {
				if ((err as Error).name !== "AbortError") setAsyncOptions([]);
			} finally {
				setIsLoading(false);
			}
		},
		[fetchFn],
	);

	const handleSearch = React.useCallback(
		(query: string) => {
			setSearchQuery(query);
			if (fetchFn) {
				clearTimeout(debounceRef.current);
				debounceRef.current = setTimeout(
					() => fetchOptions(query),
					debounceMs,
				);
			}
		},
		[fetchFn, fetchOptions, debounceMs],
	);

	React.useEffect(() => {
		if (open && fetchFn) fetchOptions("");
	}, [open, fetchFn, fetchOptions]);

	React.useEffect(() => {
		return () => {
			clearTimeout(debounceRef.current);
			abortRef.current?.abort();
		};
	}, []);

	// ============================================
	// HANDLERS
	// ============================================

	const handleSelect = React.useCallback(
		(val: string) => {
			const opt = options.find((o) => o.value === val);
			setInternalValue(val);
			onValueChange?.(val, opt);
			setOpen(false);
			setSearchQuery("");
		},
		[options, onValueChange],
	);

	const handleClear = React.useCallback(
		(e: React.MouseEvent) => {
			e.stopPropagation();
			setInternalValue("");
			onValueChange?.("", undefined);
		},
		[onValueChange],
	);

	// ============================================
	// RENDER
	// ============================================

	return (
		<div className={cn("relative", className)}>
			{name && <input type="hidden" name={name} value={value} />}
			<Popover open={open} onOpenChange={setOpen} modal>
				<PopoverTrigger asChild>
					<Button
						variant="outline"
						role="combobox"
						aria-expanded={open}
						disabled={disabled}
						className={cn(
							"w-full justify-between font-normal",
							!value && "text-muted-foreground",
						)}
					>
						<div className="flex-1 truncate text-left">
							{value && selectedOption ? (
								<DefaultOption option={selectedOption} />
							) : (
								<span>{placeholder}</span>
							)}
						</div>
						{clearable && value ? (
							<X
								className="h-4 w-4 shrink-0 opacity-50 hover:opacity-100"
								onClick={handleClear}
							/>
						) : isLoading ? (
							<Loader2 className="h-4 w-4 shrink-0 opacity-50 animate-spin" />
						) : (
							<ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
						)}
					</Button>
				</PopoverTrigger>
				<PopoverContent
					className="w-[--radix-popover-trigger-width] p-0"
					align="start"
				>
					<Command shouldFilter={false}>
						<CommandInput
							placeholder={searchPlaceholder}
							value={searchQuery}
							onValueChange={handleSearch}
						/>
						<CommandList>
							{isLoading && (
								<div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
									<Loader2 className="h-4 w-4 mr-2 animate-spin" />
									Loading...
								</div>
							)}
							{!isLoading && options.length === 0 && (
								<CommandEmpty>{emptyMessage}</CommandEmpty>
							)}
							{!isLoading && options.length > 0 && (
								<CommandGroup>
									{options.map((option) => (
										<CommandItem
											key={option.value}
											value={option.value}
											disabled={option.disabled}
											onSelect={handleSelect}
											className={`!bg-transparent hover:!bg-secondary ${value === option.value && `!bg-secondary`}`}
										>
											{renderOption?.(option) ?? (
												<DefaultOption
													option={option}
												/>
											)}
											<Check
												className={cn(
													"ml-auto h-4 w-4",
													value === option.value
														? "opacity-100"
														: "opacity-0",
												)}
											/>
										</CommandItem>
									))}
								</CommandGroup>
							)}
						</CommandList>
					</Command>
				</PopoverContent>
			</Popover>
		</div>
	);
}
