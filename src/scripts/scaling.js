function updatePortions(newServings) {
  const originalServings = parseInt(
    document.querySelector("#portion-input").getAttribute("value"),
    10
  );
  const scalingFactor = newServings / originalServings;

  document.querySelectorAll("[data-amount]").forEach((element) => {
    const originalAmount = parseFloat(element.getAttribute("data-amount"));
    let scaledAmount = originalAmount * scalingFactor;

    // Sinnvolle Rundung
    if (scaledAmount < 1) {
      scaledAmount = scaledAmount.toFixed(2);
    } else if (scaledAmount < 10) {
      scaledAmount = scaledAmount.toFixed(1);
    } else {
      scaledAmount = Math.round(scaledAmount);
    }

    element.textContent = scaledAmount;
  });
}

document.querySelector("#portion-input").addEventListener("input", (e) => {
  updatePortions(parseInt(e.target.value, 10));
});