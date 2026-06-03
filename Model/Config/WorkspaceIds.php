<?php

namespace Fastly\Cdn\Model\Config;

use Fastly\Cdn\Model\Api;
use Magento\Framework\Data\OptionSourceInterface;

class WorkspaceIds implements OptionSourceInterface
{

    public function __construct(
        private Api $api,
    ) {}
    public function toOptionArray()
    {
        try {

            $workspaceIds = $this->api->getWorkspaceIds();

            $options = [];

            foreach ($workspaceIds as $workspaceId) {
                $options[] = [
                    'value' => $workspaceId['id'],
                    'label' => $workspaceId['name'],
                ];
            }

            return $options;

        } catch (\Throwable $e) {
            return [];
        }
    }
}
