/**
 * Component index - re-exports commonly used components
 * Allows path alias @/components to resolve properly
 */

export { AppTabBar } from "./navigation/AppTabBar";
export { ThemedText } from "./themed-text";
export type { ThemedTextProps } from "./themed-text";
export { ThemedView } from "./themed-view";
export type { ThemedViewProps } from "./themed-view";
export { ConfirmDialog } from "./ui/ConfirmDialog";
export { EmptyState } from "./ui/EmptyState";
export { default as ErrorBoundary } from "./ui/ErrorBoundary";
export { ErrorState } from "./ui/ErrorState";
export { IconButton } from "./ui/IconButton";
export { LoadingState } from "./ui/LoadingState";
export { PrimaryButton } from "./ui/PrimaryButton";
export type { PrimaryButtonProps } from "./ui/PrimaryButton";
export { SearchInput } from "./ui/SearchInput";
export { SecondaryButton } from "./ui/SecondaryButton";
export type { SecondaryButtonProps } from "./ui/SecondaryButton";
export { StatusBadge } from "./ui/StatusBadge";
export { showToast, useToast } from "./use-toast";

export type { ConfirmDialogProps } from "./ui/ConfirmDialog";
export type { EmptyStateProps } from "./ui/EmptyState";
export type { ErrorBoundaryProps } from "./ui/ErrorBoundary";
export type { ErrorStateProps } from "./ui/ErrorState";
export type { IconButtonIcon, IconButtonProps } from "./ui/IconButton";
export type { LoadingStateProps } from "./ui/LoadingState";
export type { SearchInputProps } from "./ui/SearchInput";
export type { Status, StatusBadgeProps } from "./ui/StatusBadge";
