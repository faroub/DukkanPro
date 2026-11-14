/**
 * saleErrors.ts - Maps internal sale error messages and prefixes to localized i18n messages.
 */

export function mapSaleErrorToMessage(
  rawMessage: string,
  t: (key: string, options?: any) => string,
): string {
  if (!rawMessage) {
    return t("sales:errors.genericFailed", {
      defaultValue: "Sale could not be completed.",
    });
  }

  if (rawMessage.includes("PRICE_CHANGED")) {
    return t("sales:priceChanged", {
      defaultValue:
        "A product price changed since checkout started. The cart has been refreshed — please confirm the sale again.",
    });
  }

  if (rawMessage.includes("PRODUCT_INACTIVE")) {
    return t("sales:errors.productInactive", {
      defaultValue: "One or more products in this sale are no longer active.",
    });
  }

  if (rawMessage.includes("INACTIVE_CUSTOMER")) {
    return t("sales:errors.inactiveCustomer", {
      defaultValue: "Cannot record debt for an inactive or archived customer.",
    });
  }

  if (rawMessage.includes("Insufficient stock")) {
    return t("sales:errors.insufficientStock", {
      defaultValue: "Insufficient stock available for one or more items.",
    });
  }

  if (
    rawMessage.includes("A customer must be selected") ||
    rawMessage.includes("customerRequiredForDebt")
  ) {
    return t("sales:errors.customerRequired", {
      defaultValue: "A customer must be selected to record debt.",
    });
  }

  if (rawMessage.includes("Customer id=") && rawMessage.includes("not found")) {
    return t("sales:errors.customerNotFound", {
      defaultValue: "The selected customer was not found.",
    });
  }

  return t("sales:errors.genericFailed", {
    defaultValue: "Sale could not be completed.",
  });
}
