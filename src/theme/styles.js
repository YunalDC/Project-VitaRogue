import { StyleSheet } from "react-native";

export const colors = {
  brand: "#0f5132",
  text: "#1f2937",
  muted: "#6b7280",
  border: "#e2e8f0",
  inputBg: "#f8fafc",
};

export default StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.brand },
  card: {
    marginTop: 48,
    marginHorizontal: 20,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
  },
  title: { fontSize: 24, fontWeight: "700", color: colors.brand },
  subtitle: { marginTop: 4, fontSize: 14, color: "#475569", marginBottom: 16 },
  label: { marginTop: 10, marginBottom: 6, fontSize: 13, color: colors.text, fontWeight: "600" },
  input: {
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
  },
  inputRow: { flexDirection: "row", alignItems: "center" },
  toggleBtn: {
    height: 44,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: "center",
  },
  toggleText: { fontWeight: "600", color: colors.brand },
  btn: {
    backgroundColor: colors.brand,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 18,
  },
  btnDisabled: { opacity: 0.7 },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  row: { flexDirection: "row", marginTop: 14, justifyContent: "center" },
  link: { color: colors.brand, fontWeight: "700" },
  muted: { color: colors.muted },
});
