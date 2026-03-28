import { Box, Text } from "ink";
import React from "react";

type KeyValueItem = {
  label: string;
  value: React.ReactNode;
};

type KeyValueListProps = {
  items: KeyValueItem[];
};

export function KeyValueList({ items }: KeyValueListProps) {
  return (
    <Box flexDirection="column">
      {items.map((item) => (
        <Box key={item.label}>
          <Text>- {item.label}: </Text>
          <Text>{item.value}</Text>
        </Box>
      ))}
    </Box>
  );
}
