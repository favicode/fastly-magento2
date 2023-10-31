<?php

namespace Fastly\Cdn\Observer;

use Fastly\Cdn\Model\Config;
use Fastly\Cdn\Model\PurgeCache;
use Magento\Cms\Api\Data\PageInterface;
use Magento\Framework\DataObject\IdentityInterface;
use Magento\Framework\Event\Observer;
use Magento\Framework\Event\ObserverInterface;

class FlushHtmlCacheAfterCmsSave implements ObserverInterface
{
    /**
     * @var Config
     */
    private $config;
    /**
     * @var PurgeCache
     */
    private $purgeCache;

    /**
     * @param Config $config
     * @param PurgeCache $purgeCache
     */
    public function __construct(
        Config $config,
        PurgeCache $purgeCache
    ) {
        $this->config = $config;
        $this->purgeCache = $purgeCache;
    }

    /**
     * If Fastly CDN is enabled and a cms page is saved them clear the html cache
     *
     * @param Observer $observer
     * @return void
     */
    public function execute(Observer $observer): void
    {
        if ($this->config->getType() === Config::FASTLY && $this->config->isEnabled()) {
            $object = $observer->getEvent()->getObject();

            if ($object instanceof IdentityInterface && $this->canPurgeObject($object)) {
                $this->purgeCache->sendPurgeRequest(['html']);
            }
        }
    }

    /**
     * Return false if purging is not allowed for object instance.
     *
     * @param IdentityInterface $object
     * @return bool
     */
    private function canPurgeObject(IdentityInterface $object): bool
    {

        if ($object instanceof PageInterface && !$this->config->canPurgeCmsPage()) {
            return false;
        }
        return true;
    }
}
