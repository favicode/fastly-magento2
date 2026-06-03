<?php

namespace Fastly\Cdn\Controller\Adminhtml\FastlyCdn\Ngwaf;

use Fastly\Cdn\Model\Api;
use Magento\Backend\App\Action;
use Magento\Backend\App\Action\Context;
use Magento\Framework\Controller\Result\JsonFactory;

class EditWorkspaceList extends Action
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

        $listId = $this->getRequest()->getParam('workspace_list_id');
        $workspaceId = $this->getRequest()->getParam('workspace_id', '');
        $listName = $this->getRequest()->getParam('workspace_list_name');
        $listDescription = $this->getRequest()->getParam('workspace_list_description', '');
        $listType = $this->getRequest()->getParam('workspace_list_type');
        $listEntries = $this->getRequest()->getParam('workspace_list_entries');
        $listEntries = explode(PHP_EOL, $listEntries);

        if (empty($listName)) {
            return $result->setData([
                'status' => false,
                'msg' => 'List name is missing.',
            ]);
        }

        if (empty($listType)) {
            return $result->setData([
                'status' => false,
                'msg' => 'List type is missing.',
            ]);
        }

        if (empty($listEntries)) {
            return $result->setData([
                'status' => false,
                'msg' => 'List entries is missing.',
            ]);
        }

        try {
            $response = $this->api->createWorkspaceList($workspaceId, $listName, $listDescription, $listType, $listEntries, $listId);

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
