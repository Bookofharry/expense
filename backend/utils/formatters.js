const nairaFormatter = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const formatNaira = (value = 0) => {
  const amount = Number(value);
  return nairaFormatter.format(Number.isFinite(amount) ? amount : 0);
};

module.exports = {
  formatNaira,
};
