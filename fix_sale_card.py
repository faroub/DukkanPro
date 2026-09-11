with open("src/features/sales/components/SaleCard.tsx", "r") as f:
    text = f.read()

text = text.replace("let iconColor = Colors.light.primary;", "let iconColor: string = Colors.light.primary;")
text = text.replace("let iconBg = Colors.light.primaryLight;", "let iconBg: string = Colors.light.primaryLight;")
text = text.replace("let badgeBg = Colors.light.primaryLight;", "let badgeBg: string = Colors.light.primaryLight;")
text = text.replace("let badgeColor = Colors.light.primary;", "let badgeColor: string = Colors.light.primary;")
text = text.replace("let subStatusColor = Colors.light.primary;", "let subStatusColor: string = Colors.light.primary;")

with open("src/features/sales/components/SaleCard.tsx", "w") as f:
    f.write(text)
