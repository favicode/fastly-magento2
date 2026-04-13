<?php

namespace Fastly\Cdn\Block\System\Config\Ngwaf;

use Magento\Config\Block\System\Config\Form\Field\FieldArray\AbstractFieldArray;

class RuleList extends AbstractFieldArray
{

    protected function _construct() // @codingStandardsIgnoreLine - required by parent class
    {
        $this->addColumn('rule_description', ['label' => __('Rule Description')]);
        $this->addColumn('rule_type', ['label' => __('Rule Type')]);
        $this->_addAfter = false;
        $this->_template = 'Fastly_Cdn::system/config/ngwaf/rules.phtml';

        parent::_construct();
    }
}
