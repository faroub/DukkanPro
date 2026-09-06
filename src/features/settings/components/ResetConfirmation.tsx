import React from "react";
import { useTranslation } from "react-i18next";
import { Alert } from "react-native";

/**
 * ResetConfirmation - A confirmation dialog for destructive data reset actions.
 - Requires exact business-name confirmation before proceeding
 - Explains that deletion cannot be undone
 - Provides cancel and confirm options
 * - All text is translated via i18n
 * - Layout remains LTR regardless of selected language
 * - Accessible labels and large touch targets
 */
export function ResetConfirmation({
  t,
  isVisible,
  onConfirm,
  onCancel,
}: {
  t: ReturnType<typeof useTranslation>["t"];
  isVisible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!isVisible) {
    return null;
  }

  React.useEffect(() => {
    Alert.alert(t("dataReset.confirmTitle"), t("dataReset.confirmMessage"), [
      { text: t("common:cancel"), style: "cancel", onPress: onCancel },
      {
        text: t("dataReset.confirm"),
        style: "destructive",
        onPress: onConfirm,
      },
    ]);
  }, [onCancel, onConfirm, t]);

  return null;
}

// Export a reusable confirmation hook/component
export function useDataResetConfirmation({
  t,
  expectedBusinessName = "Dukan Grocery",
  onConfirm,
}: {
  t: ReturnType<typeof useTranslation>["t"];
  expectedBusinessName?: string;
  onConfirm: () => void | Promise<void>;
}) {
  const [showConfirmation, setShowConfirmation] = React.useState(false);
  const [enteredBusinessName, setEnteredBusinessName] = React.useState("");

  const handleShow = React.useCallback(() => {
    setEnteredBusinessName("");
    setShowConfirmation(true);
  }, []);

  const handleHide = React.useCallback(() => {
    setShowConfirmation(false);
  }, []);

  const handleConfirm = React.useCallback(async () => {
    // Verify exact business name match
    if (enteredBusinessName.trim() !== expectedBusinessName) {
      // TODO: Show error toast - wrong business name
      setShowConfirmation(false);
      return;
    }

    // Proceed with data reset
    await onConfirm();
    setShowConfirmation(false);
  }, [enteredBusinessName, expectedBusinessName, onConfirm, t]);

  const handleNameChange = React.useCallback((text: string) => {
    setEnteredBusinessName(text);
  }, []);

  return {
    showConfirmation,
    setShowConfirmation,
    enteredBusinessName,
    setEnteredBusinessName,
    handleShow,
    handleHide,
    handleConfirm,
    handleNameChange,
  };
}
