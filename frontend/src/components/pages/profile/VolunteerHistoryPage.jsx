import React from 'react';
import { History } from 'lucide-react';
import Card from '../../ui/Card';
import EmptyState from '../../ui/EmptyState';

export default function VolunteerHistoryPage() {
  return (
    <div style={{ maxWidth: 'var(--max-content-width)', margin: 'var(--space-6) auto', padding: '0 var(--space-4)' }}>
      <h1 style={{ fontSize: 'var(--font-size-h1)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-primary)', margin: '0 0 var(--space-4)' }}>Lich su tinh nguyen</h1>
      <Card><EmptyState icon={History} title="Chua co lich su tinh nguyen" description="Tham gia cac su kien tinh nguyen de xay dung lich su hoat dong cua ban. Moi su kien ban tham gia se duoc ghi lai tai day." /></Card>
    </div>
  );
}
