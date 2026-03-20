import React from 'react';
import KnowledgeBaseSettings from '../KnowledgeBaseSettings';

const KnowledgeConfig = ({ agentId, orgId, data, onUpdate }) => {
    return (
        <KnowledgeBaseSettings 
            agentId={agentId} 
            orgId={orgId} 
            knowledge={data.knowledge_configuration || {}} 
            onUpdate={(val) => onUpdate('knowledge_configuration', val)}
        />
    );
};

export default KnowledgeConfig;
