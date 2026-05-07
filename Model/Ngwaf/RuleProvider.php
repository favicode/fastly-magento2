<?php

namespace Fastly\Cdn\Model\Ngwaf;

use Fastly\Cdn\Model\Api;
use Fastly\Cdn\Model\Config;
use Magento\Framework\App\Helper\AbstractHelper;
use Magento\Framework\App\Helper\Context;
use Magento\Framework\Filesystem\Driver\File;
use Magento\Framework\Module\Dir;
use Magento\Framework\Module\Dir\Reader;

class RuleProvider extends AbstractHelper
{

    const SYSTEM_SIGNALS_FILE = "/ngwaf/signals.json";
    const SYSTEM_LISTS_FILE = "/ngwaf/lists.json";

    private array $ruleTypes = [
        'request' => 'Request - block, allow or tag request',
        'signal' => 'Signal exclusion - exclude a system signal',
        'rate_limit' => 'Rate Limit - rate limit requests',
    ];

    private array $ruleSelectOptionTypes = ['anomaly', 'attack', 'informational'];

    private Api $api;
    private File $driverFile;
    private Reader $reader;

    public function __construct(
        Api $api,
        Context $context,
        File $driverFile,
        Reader $reader
    ) {
        $this->api = $api;
        parent::__construct($context);
        $this->driverFile = $driverFile;
        $this->reader = $reader;
    }

    public function getPayload() {

        $payload = [
            'rule_types' => $this->ruleTypes,
            'conditions' => $this->getConditionOptions(),
            'actions' => $this->getActionOptions(),
            'rate_limit_identifiers' => $this->getRateLimitIdentifiers(),
            'request_logging' => $this->getRequestLoggingOptions(),
            'multival_parameters' => $this->getMultivalParameters()
        ];

        return json_encode($payload);

    }


    public function getConditionOptions() {

        $conditions = array_merge($this->getSimpleRuleOptions(), $this->getMultivalRuleOptions());

        return $conditions;

    }

    public function getSimpleRuleOptions()
    {
        return [
            "agent_name" => [
                'name' => 'Agent Name',
                'type' => 'single',
                'options' => 'text_list_options',
                'conditions' => [
                    "equals" => 'Equals',
                    "does_not_equal" => 'Does Not Equal',
                    "contains" => 'Contains',
                    "does_not_contain" => 'Does Not Contain',
                    "like" => 'Like (wildcard)',
                    "not_like" => 'Not Like (wildcard)',
                    "matches" => 'Matches (regexp)',
                    "does_not_match" => 'Does Not Match (regexp)',
                    "in_list" => 'Is In List',
                    "not_in_list" => 'Is Not In List',
                ]
            ],
            "country" => [
                'name' => 'Country (capitalized two-letter country codes)',
                'type' => 'single',
                'options' => 'country_list_options',
                'conditions' => [
                    "equals" => 'Equals',
                    "does_not_equal" => 'Does Not Equal',
                    "in_list" => 'Is In List',
                    "not_in_list" => 'Is Not In List',
                ]
            ],
            "domain" => [
                'name' => 'Domain',
                'type' => 'single',
                'options' => 'text_list_options',
                'conditions' => [
                    "equals" => 'Equals',
                    "does_not_equal" => 'Does Not Equal',
                    "contains" => 'Contains',
                    "does_not_contain" => 'Does Not Contain',
                    "like" => 'Like (wildcard)',
                    "not_like" => 'Not Like (wildcard)',
                    "matches" => 'Matches (regexp)',
                    "does_not_match" => 'Does Not Match (regexp)',
                    "in_list" => 'Is In List',
                    "not_in_list" => 'Is Not In List',
                ]
            ],
            "ip" => [
                'name' => 'IP Address',
                'type' => 'single',
                'options' => 'ip_list_options',
                'conditions' => [
                    "equals" => 'Equals',
                    "does_not_equal" => 'Does Not Equal',
                    "in_list" => 'Is In List',
                    "not_in_list" => 'Is Not In List',
                ]
            ],
            //"ja3_fingerprint" => [
            //    'name' => 'JA3 Fingerprint',
            //    'conditions' => [
            //        "equals" => 'Equals',
            //        "does_not_equal" => 'Does Not Equal',
            //        "in_list" => 'Is In List',
            //        "not_in_list" => 'Is Not In List',
            //    ]
            //],
            //"ja4_fingerprint" => [
            //    'name' => 'JA4 Fingerprint',
            //    'conditions' => [
            //        "equals" => 'Equals',
            //        "does_not_equal" => 'Does Not Equal',
            //        "in_list" => 'Is In List',
            //        "not_in_list" => 'Is Not In List',
            //    ]
            //],
            "method" => [
                'name' => 'Method',
                'type' => 'single',
                'select_options' => [
                    'GET' => 'GET',
                    'POST' => 'POST',
                    'PUT' => 'PUT',
                    'PATCH' => 'PATCH',
                    'DELETE' => 'DELETE',
                    'HEAD' => 'HEAD',
                    'TRACE' => 'TRACE',
                    'PROPFIND' => 'PROPFIND'
                ],
                'conditions' => [
                    "equals" => 'Equals',
                    "does_not_equal" => 'Does Not Equal'
                ]
            ],
            "path" => [
                'name' => 'Path',
                'type' => 'single',
                'options' => 'text_list_options',
                'conditions' => [
                    "equals" => 'Equals',
                    "does_not_equal" => 'Does Not Equal',
                    "contains" => 'Contains',
                    "does_not_contain" => 'Does Not Contain',
                    "like" => 'Like (wildcard)',
                    "not_like" => 'Not Like (wildcard)',
                    "matches" => 'Matches (regexp)',
                    "does_not_match" => 'Does Not Match (regexp)',
                    "in_list" => 'Is In List',
                    "not_in_list" => 'Is Not In List',
                ]
            ],
            "protocol_version" => [
                'name' => 'Protocol Version',
                'type' => 'single',
                'options' => ['HTTP/0.9', 'HTTP/1.0', 'HTTP/1.1', 'HTTP/2.0'],
                'conditions' => [
                    "equals" => 'Equals',
                    "does_not_equal" => 'Does Not Equal',
                ]
            ],
            "response_code" => [
                'name' => 'Response Code',
                'type' => 'single',
                'options' => 'text_list_options',
                'conditions' => [
                    "equals" => 'Equals',
                    "does_not_equal" => 'Does Not Equal',
                    "greater_equal" => 'Greater Than or Equal To',
                    "lesser_equal" => 'Less Than or Equal To',
                    "like" => 'Like (wildcard)',
                    "not_like" => 'Not Like (wildcard)',
                    "matches" => 'Matches (regexp)',
                    "does_not_match" => 'Does Not Match (regexp)',
                    "in_list" => 'Is In List',
                    "not_in_list" => 'Is Not In List',
                ]
            ],
            "scheme" => [
                'name' => 'Scheme',
                'type' => 'single',
                'select_options' => ['HTTP' => 'HTTP', 'HTTPS' => 'HTTPS'],
                'conditions' => [
                    "equals" => 'Equals',
                    "does_not_equal" => 'Does Not Equal'
                ]
            ],
            "user_agent" => [
                'name' => 'User Agent',
                'type' => 'single',
                'options' => 'text_list_options',
                'conditions' => [
                    "equals" => 'Equals',
                    "does_not_equal" => 'Does Not Equal',
                    "contains" => 'Contains',
                    "does_not_contain" => 'Does Not Contain',
                    "like" => 'Like (wildcard)',
                    "not_like" => 'Not Like (wildcard)',
                    "matches" => 'Matches (regexp)',
                    "does_not_match" => 'Does Not Match (regexp)',
                    "in_list" => 'Is In List',
                    "not_in_list" => 'Is Not In List',
                ]
            ],
        ];
    }

    public function getMultivalRuleOptions()
    {
        return [
            "post_parameter" => [
                'name' => 'Post Parameter',
                'type' => 'multival',
                'multival_options' => ['name', 'value', 'value_int'],
                'conditions' => [
                    "exists" => 'Exist where',
                    "does_not_exist" => 'Does Not Exist where',
                ]
            ],
            "query_parameter" => [
                'name' => 'Query Parameter',
                'type' => 'multival',
                'multival_options' => ['name', 'value', 'value_int'],
                'conditions' => [
                    "exists" => 'Exist where',
                    "does_not_exist" => 'Does Not Exist where',
                ]
            ],
            "request_cookie" => [
                'name' => 'Request Cookie',
                'type' => 'multival',
                'multival_options' => ['name', 'value', 'value_int'],
                'conditions' => [
                    "exists" => 'Exist where',
                    "does_not_exist" => 'Does Not Exist where',
                ]
            ],
            "request_header" => [
                'name' => 'Request Header',
                'type' => 'multival',
                'multival_options' => ['name', 'value_string', 'value_int', 'value_ip'],
                'conditions' => [
                    "exists" => 'Exist where',
                    "does_not_exist" => 'Does Not Exist where',
                ]
            ],
            "response_header" => [
                'name' => 'Response Header',
                'type' => 'multival',
                'multival_options' => ['name', 'value_string'],
                'conditions' => [
                    "exists" => 'Exist where',
                    "does_not_exist" => 'Does Not Exist where',
                ]
            ],
            "signal" => [
                'name' => 'Signal',
                'type' => 'multival',
                'multival_options' => ['parameter_name', 'parameter_value', 'signal_id'],
                'options' => 'signal_list_options',
                'conditions' => [
                    "exists" => 'Exist where',
                    "does_not_exist" => 'Does Not Exist where',
                ]
            ]
        ];
    }

    public function getMultivalParameters()
    {
        return [
            "name" => [
                'name' => 'Name',
                'type' => 'single',
                'options' => 'text_list_options',
                'conditions' => [
                    "equals" => 'Equals',
                    "does_not_equal" => 'Does Not Equal',
                    "contains" => 'Contains',
                    "does_not_contain" => 'Does Not Contain',
                    "like" => 'Like (wildcard)',
                    "not_like" => 'Not Like (wildcard)',
                    "matches" => 'Matches (regexp)',
                    "does_not_match" => 'Does Not Match (regexp)',
                    "in_list" => 'Is In List',
                    "not_in_list" => 'Is Not In List',
                ]
            ],
            "value" => [
                'name' => 'Value',
                'type' => 'single',
                'options' => 'text_list_options',
                'conditions' => [
                    "equals" => 'Equals',
                    "does_not_equal" => 'Does Not Equal',
                    "contains" => 'Contains',
                    "does_not_contain" => 'Does Not Contain',
                    "like" => 'Like (wildcard)',
                    "not_like" => 'Not Like (wildcard)',
                    "matches" => 'Matches (regexp)',
                    "does_not_match" => 'Does Not Match (regexp)',
                    "in_list" => 'Is In List',
                    "not_in_list" => 'Is Not In List',
                ]
            ],
            "value_string" => [
                'name' => 'Value (string)',
                'type' => 'single',
                'options' => 'text_list_options',
                'conditions' => [
                    "equals" => 'Equals',
                    "does_not_equal" => 'Does Not Equal',
                    "contains" => 'Contains',
                    "does_not_contain" => 'Does Not Contain',
                    "like" => 'Like (wildcard)',
                    "not_like" => 'Not Like (wildcard)',
                    "matches" => 'Matches (regexp)',
                    "does_not_match" => 'Does Not Match (regexp)',
                    "in_list" => 'Is In List',
                    "not_in_list" => 'Is Not In List',
                ]
            ],
            "value_ip" => [
                'name' => 'Value (IP)',
                'type' => 'single',
                'options' => 'ip_list_options',
                'conditions' => [
                    "equals" => 'Equals',
                    "does_not_equal" => 'Does Not Equal',
                    "contains" => 'Contains',
                    "does_not_contain" => 'Does Not Contain',
                    "like" => 'Like (wildcard)',
                    "not_like" => 'Not Like (wildcard)',
                    "matches" => 'Matches (regexp)',
                    "does_not_match" => 'Does Not Match (regexp)',
                    "in_list" => 'Is In List',
                    "not_in_list" => 'Is Not In List',
                ]
            ],
            "value_int" => [
                'name' => 'Value (Integer)',
                'type' => 'single',
                'options' => 'text_list_options',
                'conditions' => [
                    "greater_equal" => 'Greater Than or Equal To',
                    "lesser_equal" => 'Less Than or Equal To',
                ]
            ],
            "parameter_name" => [
                'name' => 'Parameter Name',
                'type' => 'single',
                'options' => 'signal_list_options',
                'conditions' => [
                    "equals" => 'Equals',
                    "does_not_equal" => 'Does Not Equal',
                    "contains" => 'Contains',
                    "does_not_contain" => 'Does Not Contain',
                    "like" => 'Like (wildcard)',
                    "not_like" => 'Not Like (wildcard)',
                    "matches" => 'Matches (regexp)',
                    "does_not_match" => 'Does Not Match (regexp)',
                    "in_list" => 'Is In List',
                    "not_in_list" => 'Is Not In List',
                ]
            ],
            "parameter_value" => [
                'name' => 'Parameter Value',
                'type' => 'single',
                'options' => 'signal_list_options',
                'conditions' => [
                    "equals" => 'Equals',
                    "does_not_equal" => 'Does Not Equal',
                    "contains" => 'Contains',
                    "does_not_contain" => 'Does Not Contain',
                    "like" => 'Like (wildcard)',
                    "not_like" => 'Not Like (wildcard)',
                    "matches" => 'Matches (regexp)',
                    "does_not_match" => 'Does Not Match (regexp)',
                    "in_list" => 'Is In List',
                    "not_in_list" => 'Is Not In List',
                ]
            ],
            "signal_id" => [
                'name' => 'Signal ID',
                'type' => 'single',
                'options' => 'signal_list_options',
                'conditions' => [
                    "in_list" => 'Is In List',
                    "not_in_list" => 'Is Not In List',
                ]
            ],
        ];
    }

    public function getActionOptions()
    {
        $rateLimitMatchTypes = [
            'rule_condition' => 'Rule Condition',
            'all_requests' => 'All Requests',
            'other_signal' => 'Other Signal',

        ];
        return [
            'request' => [
                'allow' => [
                    'name' => 'Allow',
                ],
                'block' => [
                    'name' => 'Block',
                ],
                'add_signal' => [
                    'name' => 'Add Signal',
                    'options' => 'custom_signal_options', // Workspace signals
                    'parameter_name' => 'signal_name'
                ],
                'deception' => [
                    'name' => 'Deception',
                    'options' => [
                        [
                            'id' => 'invalid_login_response',
                            'display_name' => 'Invalid Login Response',
                        ]
                    ],
                    'parameter_name' => 'deception_type',
                ]
            ],
            'signal' => [
                'exclude_signal' => [
                    'name' => 'Exclude Signal',
                    'options' => 'exclude_signal_options', // list of other signals
                    'parameter_name' => 'signal'
                ]
            ],
            'rate_limit' => [
                'log_request' => [
                    'name' => 'Log Request',
                    'signal_match' => $rateLimitMatchTypes,
                    'options' => 'log_request_options' // list of signal options for "Other Signal"
                ],
                'block_signal' => [
                    'name' => 'Block Signal',
                    'signal_match' => $rateLimitMatchTypes,
                    'options' => 'block_signal_options' // list of signal options for "Other Signal"
                ],
                'deception' => [
                    'name' => 'Deception',
                    'signal_match' => $rateLimitMatchTypes,
                    'options' => 'deception_signal_options' // list of signal options for "Other Signal"
                ]
            ]
        ];
    }

    public function getRateLimitIdentifiers()
    {
        return [
            'ip' => [
                'name' => 'IP Address',
                'has_value' => false,
            ],
            'request_header' => [
                'name' => 'Request Header',
                'input_parameter_name' => 'name',
                'has_value' => true,
            ],
            'request_cookie' => [
                'name' => 'Request Cookie',
                'input_parameter_name' => 'name',
                'has_value' => true,
            ],
            'post_parameter' => [
                'name' => 'Post Parameter Value',
                'input_parameter_name' => 'name',
                'has_value' => true,
            ],
            'signal_payload' => [
                'name' => 'Signal Payload',
                'input_parameter_name' => 'signal',
                'has_value' => true,
                'options' => 'custom_signal_options' // Workspace Signals
            ]
        ];
    }

    public function getRequestLoggingOptions()
    {
        return [
            'sampled' => 'Sample',
            'none' => 'None',
        ];
    }

    public function getSelectOptions()
    {

        try {

            $workspaceSignals = $this->api->getSignals();
            $workspaceLists = $this->api->getWorkspaceLists();

            $sortedSignals = [];

            // Adjust signal payload from API call to match system signal format
            foreach ($workspaceSignals as $signal) {
                $sortedSignals[] = [
                    'id' => $signal['reference_id'],
                    'name' => $signal['reference_id'],
                    'display_name' => $signal['name'],
                    'type' => 'anomaly',
                    'detection_type' => 'custom',
                    'enabled' => true,
                ];
            }

            $etcPath = $this->reader->getModuleDir(Dir::MODULE_ETC_DIR, Config::FASTLY_MODULE_NAME);

            $systemSignals =  $this->driverFile->fileGetContents($etcPath . self::SYSTEM_SIGNALS_FILE);
            $systemSignals = json_decode($systemSignals, true);

            $systemLists = $this->driverFile->fileGetContents($etcPath . self::SYSTEM_LISTS_FILE);
            $systemLists = json_decode($systemLists, true);


            $signalOptions = array_merge($sortedSignals, $systemSignals);
            $listOptions = array_merge($workspaceLists, $systemLists);

            // Sort select options by type
            usort($signalOptions, function($a, $b)
            {
                return strcmp($a['type'] ?? '', $b['type'] ?? '');
            });
            usort($listOptions, function($a, $b)
            {
                return strcmp($a['type'] ?? '', $b['type'] ?? '');
            });

            $customSignalOptions = [];
            $excludeSignalOptions = [];
            $logRequestOptions = [];
            $blockSignalOptions = [];
            $deceptionOptions = [];

            foreach ($signalOptions as $option) {

                if (!isset($option['type'], $option['enabled'], $option['detection_type'])) {
                    continue;
                }

                if (!in_array($option['type'], $this->ruleSelectOptionTypes)) {
                    continue;
                }

                // Templated options are always set as enabled -> false
                if (!$option['enabled'] && $option['detection_type'] !== 'templated') {
                    continue;
                }

                if ($option['detection_type'] === 'custom') {

                    $customSignalOptions[] = $option;
                    $logRequestOptions[] = $option;
                    $blockSignalOptions[] = $option;
                    $deceptionOptions[] = $option;

                } else if ($option['type'] === 'attack') {

                    $excludeSignalOptions[] = $option;
                    $logRequestOptions[] = $option;
                    $deceptionOptions[] = $option;

                } else if ($option['type'] === 'informational') {

                    $excludeSignalOptions[] = $option;
                    $logRequestOptions[] = $option;
                    $deceptionOptions[] = $option;

                } else if ($option['type'] === 'anomaly' && $option['detection_type'] === 'templated') {

                    $blockSignalOptions[] = $option;

                } else if ($option['type'] === 'anomaly' && $option['detection_type'] === 'system') {

                    $excludeSignalOptions[] = $option;
                    $logRequestOptions[] = $option;
                    $deceptionOptions[] = $option;

                }
            }

            $textListOptions = [];
            $countryListOptions = [];
            $ipListOptions = [];
            $signalListOptions = [];

            foreach ($listOptions as $option) {

                if (!isset($option['type'])) {
                    continue;
                }

                if ($option['type'] === 'country') {
                    $countryListOptions[] = $option;
                } elseif ($option['type'] === 'ip') {
                    $ipListOptions[] = $option;
                } elseif ($option['type'] === 'signal') {
                    $signalListOptions[] = $option;
                } elseif ($option['type'] === 'wildcard' || $option['type'] === 'string') {
                    $textListOptions[] = $option;
                }
            }

            return [
                'custom_signal_options' => $customSignalOptions,
                'exclude_signal_options' => $excludeSignalOptions,
                'block_signal_options' => $blockSignalOptions,
                'log_request_options' => $logRequestOptions,
                'deception_signal_options' => $deceptionOptions,
                'country_list_options' => $countryListOptions,
                'ip_list_options' => $ipListOptions,
                'signal_list_options' => $signalListOptions,
                'text_list_options' => $textListOptions,
            ];

        } catch (\Throwable $exception) {
            return [];
        }
    }
}
