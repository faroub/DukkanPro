with open("src/features/sales/SaleDetailScreen.tsx", "r") as f:
    text = f.read()

text = text.replace("let statusBadgeBg = Colors.light.primaryLight;", "let statusBadgeBg: string = Colors.light.primaryLight;")
text = text.replace("let statusBadgeColor = Colors.light.primary;", "let statusBadgeColor: string = Colors.light.primary;")
text = text.replace("let heroCardBg = '#E8F5EE';", "let heroCardBg: string = '#E8F5EE';")
text = text.replace("let heroBorderColor = '#C7E7D2';", "let heroBorderColor: string = '#C7E7D2';")

# fix implicity any: `Parameter 'it' implicitly has an 'any' type.`
text = text.replace("setLocalSale(prev => {\n      if (!prev) return prev;\n      const newItems = prev.items.filter(it => it.id !== itemId);", "setLocalSale(prev => {\n      if (!prev) return prev;\n      const newItems = prev.items.filter((it: any) => it.id !== itemId);")

text = text.replace("w => w.name === 'cash'", "(w: any) => w.name === 'cash'")

text = text.replace("key={index}\n            item={item}", "key={index}\n            item={item as any}")

# check if we can fix item / index
text = text.replace("renderItem={({ item, index }) =>", "renderItem={({ item, index }: any) =>")
text = text.replace("localSale.items.map((item, index)", "localSale.items.map((item: any, index: number)")

with open("src/features/sales/SaleDetailScreen.tsx", "w") as f:
    f.write(text)
