<?php

namespace Fastly\Cdn\Plugin\Cms;

use Fastly\Cdn\Model\Config;
use Fastly\Cdn\Model\PurgeCache;
use Magento\VersionsCms\Model\Hierarchy\Node as HierarchyNode;

class NodeSavePlugin
{
    /**
     * @var Config
     */
    private $fastlyConfig;
    /**
     * @var PurgeCache
     */
    private $purgeCache;

    /**
     * @param Config $fastlyConfig
     * @param PurgeCache $purgeCache
     */
    public function __construct(
        Config $fastlyConfig,
        PurgeCache $purgeCache
    ) {
        $this->fastlyConfig = $fastlyConfig;
        $this->purgeCache = $purgeCache;
    }

    /**
     * Reset fastly html cache after nodes save
     *
     * @param HierarchyNode $subject
     * @param HierarchyNode $result
     * @return HierarchyNode
     * @SuppressWarnings(PHPMD.UnusedFormalParameter)
     */
    public function afterCollectTree(HierarchyNode $subject, HierarchyNode $result) : HierarchyNode
    {
        if ($this->fastlyConfig->getType() === Config::FASTLY && $this->fastlyConfig->isEnabled()) {
            $this->purgeCache->sendPurgeRequest(['html']);
        }

        return $result;
    }
}
