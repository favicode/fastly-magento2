<?php

namespace Fastly\Cdn\Controller\Adminhtml\FastlyCdn\Ngwaf;

use Fastly\Cdn\Model\Api;
use Magento\Backend\App\Action;
use Magento\Backend\App\Action\Context;
use Magento\Framework\Controller\Result\JsonFactory;

class EditVirtualPatch extends Action
{
    const ADMIN_RESOURCE = 'Magento_Backend::cache';

    /**
     * @var JsonFactory
     */
    private $resultJsonFactory;

    /**
     * @var Api
     */
    private $api;


    public function __construct(
        Context $context,
        JsonFactory $resultJsonFactory,
        Api $api
    ) {
        parent::__construct($context);

        $this->api = $api;
        $this->resultJsonFactory = $resultJsonFactory;
    }

    public function execute()
    {
        $result = $this->resultJsonFactory->create();

        $patchId = $this->getRequest()->getParam('patch_id');
        $workspaceId = $this->getRequest()->getParam('workspace_id', '');
        $patchStatus = $this->getRequest()->getParam('patch_status');
        $patchStatus = filter_var($patchStatus, FILTER_VALIDATE_BOOLEAN);
        $patchMode = $this->getRequest()->getParam('patch_mode');

        if (empty($patchId)) {
            return $result->setData([
                'status' => false,
                'msg' => 'Patch ID is missing.',
            ]);
        }

        if (empty($patchMode)) {
            return $result->setData([
                'status' => false,
                'msg' => 'Patch mode is missing.',
            ]);
        }

        try {
            $response = $this->api->editVirtualPatch($workspaceId, $patchId, $patchMode, $patchStatus);

            return $result->setData([
                'status' => $response
            ]);

        } catch (\Throwable $e) {
            return $result->setData([
                'status' => false,
                'msg' => $e->getMessage(),
            ]);
        }
    }
}
