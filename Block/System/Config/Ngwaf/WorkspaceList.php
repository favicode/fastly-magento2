<?php

namespace Fastly\Cdn\Block\System\Config\Ngwaf;

use Magento\Config\Block\System\Config\Form\Field\FieldArray\AbstractFieldArray;

class WorkspaceList extends AbstractFieldArray
{

    protected function _construct() // @codingStandardsIgnoreLine - required by parent class
    {
        $this->addColumn('workspace_list_name', ['label' => __('List Name')]);
        $this->addColumn('workspace_list_type', ['label' => __('List Type')]);
        $this->_addAfter = false;
        $this->_template = 'Fastly_Cdn::system/config/ngwaf/workspace-lists.phtml';

        parent::_construct();
    }
}
