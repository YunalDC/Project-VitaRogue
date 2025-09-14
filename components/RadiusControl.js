// components/RadiusControl.js
import React from "react";
import { View, Text, TouchableOpacity } from "react-native";

export default function RadiusControl({
  value,
  onChange,
  min = 0.5,
  max = 10,
  step = 0.5,
}) {
  const clamp = (n) => Math.min(max, Math.max(min, n));
  const setVal = (n) => onChange(clamp(Math.round(n / step) * step));
  const pct = ((value - min) / (max - min)) * 100;

  return (
    <View style={{ marginTop: 8 }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <TouchableOpacity
          onPress={() => setVal(value - step)}
          activeOpacity={0.8}
          style={{
            paddingVertical: 8,
            paddingHorizontal: 12,
            borderWidth: 1,
            borderColor: "#334155",
            borderRadius: 10,
          }}
        >
          <Text style={{ color: "#e5e7eb", fontWeight: "700" }}>−</Text>
        </TouchableOpacity>

        <Text style={{ color: "#e5e7eb", fontWeight: "800" }}>
          {value.toFixed(1)} km
        </Text>

        <TouchableOpacity
          onPress={() => setVal(value + step)}
          activeOpacity={0.8}
          style={{
            paddingVertical: 8,
            paddingHorizontal: 12,
            borderWidth: 1,
            borderColor: "#334155",
            borderRadius: 10,
          }}
        >
          <Text style={{ color: "#e5e7eb", fontWeight: "700" }}>+</Text>
        </TouchableOpacity>
      </View>

      {/* progress track */}
      <View
        style={{
          marginTop: 10,
          height: 10,
          backgroundColor: "#1f2937",
          borderRadius: 6,
          overflow: "hidden",
        }}
      >
        <View
          style={{
            width: `${Math.max(0, Math.min(100, pct))}%`,
            height: "100%",
            backgroundColor: "#10B981",
          }}
        />
      </View>
    </View>
  );
}
