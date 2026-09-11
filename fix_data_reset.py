with open("src/features/settings/DataResetScreen.tsx", "r") as f:
    text = f.read()

text = text.replace("styles.impactChips", "styles.impactChipsStyle")
text = text.replace("Colors.light.divider", "Colors.light.border")

if "impactChipsStyle: {" not in text:
    text = text.replace("impactChip: {", "impactChipsStyle: { flexDirection: 'row', flexWrap: 'wrap' },\n  impactChip: {")

with open("src/features/settings/DataResetScreen.tsx", "w") as f:
    f.write(text)
