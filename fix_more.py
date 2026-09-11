with open("src/features/settings/MoreScreen.tsx", "r") as f:
    text = f.read()

text = text.replace("style={styles.communityBannerStitchInner}", "style={styles.communityBannerInner}")
text = text.replace("style={styles.footerText}", "style={{fontSize: 11, color: '#9CA3AF'}}")

with open("src/features/settings/MoreScreen.tsx", "w") as f:
    f.write(text)
