import type { CSSProperties, ReactNode } from 'react';
import { HolderOutlined } from '@ant-design/icons';
import { Space } from 'antd';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

type Props = {
  id: string;
  children: ReactNode;
};

export default function SortableRow({ id, children }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.7 : 1,
    cursor: 'grab',
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Space align="start" style={{ width: '100%' }}>
        <div
          {...attributes}
          {...listeners}
          style={{
            paddingTop: 8,
            color: '#999',
            cursor: 'grab',
            userSelect: 'none',
          }}
        >
          <HolderOutlined />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
      </Space>
    </div>
  );
}