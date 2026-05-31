import type { ReactNode } from 'react';
import { Card, Statistic, Typography } from 'antd';

const { Text } = Typography;

type Props = {
  title: string;
  value: string | number;
  prefix?: ReactNode;
  suffix?: ReactNode;
  loading?: boolean;
  valueColor?: string;
  subtitle?: string;
};

export default function StatCard({
  title,
  value,
  prefix,
  suffix,
  loading = false,
  valueColor,
  subtitle,
}: Props) {
  return (
    <Card size="small">
      <Statistic
        title={title}
        value={value}
        prefix={prefix}
        suffix={suffix}
        loading={loading}
        valueStyle={valueColor ? { color: valueColor } : undefined}
      />
      {subtitle ? <Text type="secondary">{subtitle}</Text> : null}
    </Card>
  );
}