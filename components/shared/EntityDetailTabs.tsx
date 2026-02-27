'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import CommentsSection from './CommentsSection'
import ActionsSection from './ActionsSection'
import DocumentsSection from './DocumentsSection'
import type { ModuleKey } from '@/types/app'

interface Props {
  projectId: string
  moduleKey: ModuleKey
  entityType: string
  entityId: string
  overview: React.ReactNode
}

export default function EntityDetailTabs({ projectId, moduleKey, entityType, entityId, overview }: Props) {
  return (
    <Tabs defaultValue="overview">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="documents">Documents</TabsTrigger>
        <TabsTrigger value="comments">Comments</TabsTrigger>
        <TabsTrigger value="actions">Actions</TabsTrigger>
      </TabsList>
      <TabsContent value="overview" className="mt-4">
        {overview}
      </TabsContent>
      <TabsContent value="documents" className="mt-4">
        <DocumentsSection
          projectId={projectId}
          moduleKey={moduleKey}
          entityType={entityType}
          entityId={entityId}
        />
      </TabsContent>
      <TabsContent value="comments" className="mt-4">
        <CommentsSection
          projectId={projectId}
          moduleKey={moduleKey}
          entityType={entityType}
          entityId={entityId}
        />
      </TabsContent>
      <TabsContent value="actions" className="mt-4">
        <ActionsSection
          projectId={projectId}
          moduleKey={moduleKey}
          entityType={entityType}
          entityId={entityId}
        />
      </TabsContent>
    </Tabs>
  )
}
