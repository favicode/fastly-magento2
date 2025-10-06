<?php

namespace Fastly\Cdn\Block\System\Config\Ngwaf;

use Magento\Config\Block\System\Config\Form\Field\FieldArray\AbstractFieldArray;

class SignalList extends AbstractFieldArray
{

    protected function _construct() // @codingStandardsIgnoreLine - required by parent class
    {
        $this->addColumn('snippet_name', ['label' => __('Signal Name')]);
        $this->_addAfter = false;
        $this->_template = 'Fastly_Cdn::system/config/ngwaf/signals.phtml';

        parent::_construct();
    }
}
