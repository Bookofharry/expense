export const currencyFormatter = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const shortDateFormatter = new Intl.DateTimeFormat("en-NG", {
  dateStyle: "medium",
});

const dateTimeFormatter = new Intl.DateTimeFormat("en-NG", {
  dateStyle: "medium",
  timeStyle: "short",
});

export const formatCurrency = (value: number | string) => {
  const amount = Number(value);
  return currencyFormatter.format(Number.isFinite(amount) ? amount : 0);
};

export const formatDate = (value?: string | null) => {
  if (!value) {
    return "Not set";
  }

  return shortDateFormatter.format(new Date(value));
};

export const formatDateTime = (value?: string | null) => {
  if (!value) {
    return "Not set";
  }

  return dateTimeFormatter.format(new Date(value));
};

export const formatAmountInput = (value: string) => {
  const numericValue = Number(value.replace(/,/g, ""));
  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    return formatCurrency(0);
  }

  return formatCurrency(numericValue);
};

export const getInitials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
