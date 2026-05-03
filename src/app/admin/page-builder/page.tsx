import React from 'react';
import { redirect } from 'next/navigation';

export default function PageBuilderRoot() {
  redirect('/admin/orchestrator');
}
