<?php

namespace Fastly\Cdn\Model\Ngwaf;

use Fastly\Cdn\Model\Api;
use Magento\Framework\App\Helper\AbstractHelper;
use Magento\Framework\App\Helper\Context;

class RuleProvider extends AbstractHelper
{

    private array $ruleTypes = [
        'request' => 'Request - block, allow or tag request',
        'signal' => 'Signal exclusion - exclude a system signal',
        'rate_limit' => 'Rate Limit - rate limit requests',
    ];
    private Api $api;

    public function __construct(
        Api $api,
        Context $context
    ) {
        $this->api = $api;
        parent::__construct($context);
    }

    public function getPayload() {

        try {
            $workspaceSignals = $this->api->getSignals();
        } catch (\Throwable $e) {
            $workspaceSignals = [];
        }

        $formatedWorkspaceSignals = [];

        foreach ($workspaceSignals as $signal) {
            $referenceId = $signal->reference_id ?? '';
            $signalName = $signal->name ?? '';
            $formatedWorkspaceSignals[][$referenceId] = $signalName;
        }

        $payload = [
            'rule_types' => $this->ruleTypes,
            'conditions' => $this->getRuleStructure(),
            'actions' => $this->getActionOptions($formatedWorkspaceSignals),
            'rate_limit_identifiers' => $this->getRateLimitIdentifiers($formatedWorkspaceSignals),
            'request_logging' => $this->getRequestLoggingOptions()
        ];

        return json_encode($payload);

    }


    public function getRuleStructure() {

        $conditions = array_merge($this->getSimpleRuleOptions(), $this->getMultivalRuleOptions());

        return $conditions;

    }

    public function getSimpleRuleOptions()
    {
        return [
            "agent_name" => [
                'name' => 'Agent Name',
                'type' => 'single',
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
                'name' => 'Country',
                'type' => 'single',
                'comment' => 'Use capitalized two-letter country codes',
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
                'select_options' => ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'TRACE', 'PROPFIND'],
                'conditions' => [
                    "equals" => 'Equals',
                    "does_not_equal" => 'Does Not Equal'
                ]
            ],
            "path" => [
                'name' => 'Path',
                'type' => 'single',
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
                'select_options' => ['HTTP/0.9', 'HTTP/1.0', 'HTTP/1.1', 'HTTP/2.0'],
                'conditions' => [
                    "equals" => 'Equals',
                    "does_not_equal" => 'Does Not Equal',
                ]
            ],
            "response_code" => [
                'name' => 'Response Code',
                'type' => 'single',
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
                'select_options' => ['HTTP', 'HTTPS'],
                'conditions' => [
                    "equals" => 'Equals',
                    "does_not_equal" => 'Does Not Equal'
                ]
            ],
            "user_agent" => [
                'name' => 'User Agent',
                'type' => 'single',
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
                'conditions' => [
                    "exists" => 'Exist where',
                    "does_not_exist" => 'Does Not Exist where',
                ]
            ],
            "query_parameter" => [
                'name' => 'Query Parameter',
                'type' => 'multival',
                'conditions' => [
                    "exists" => 'Exist where',
                    "does_not_exist" => 'Does Not Exist where',
                ]
            ],
            "request_cookie" => [
                'name' => 'Request Cookie',
                'type' => 'multival',
                'conditions' => [
                    "exists" => 'Exist where',
                    "does_not_exist" => 'Does Not Exist where',
                ]
            ],
            "request_header" => [
                'name' => 'Request Header',
                'type' => 'multival',
                'conditions' => [
                    "exists" => 'Exist where',
                    "does_not_exist" => 'Does Not Exist where',
                ]
            ],
            "response_header" => [
                'name' => 'Response Header',
                'type' => 'multival',
                'conditions' => [
                    "exists" => 'Exist where',
                    "does_not_exist" => 'Does Not Exist where',
                ]
            ],
            "signal" => [
                'name' => 'Signal',
                'type' => 'multival',
                'conditions' => [
                    "exists" => 'Exist where',
                    "does_not_exist" => 'Does Not Exist where',
                ]
            ]
        ];
    }

    public function getActionOptions(array $workspaceSignals)
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
                    'options' => $workspaceSignals, // Workspace signals
                    'parameter_name' => 'signal_name'
                ],
                'deception' => [
                    'name' => 'Deception',
                    'options' => ['invalid_login_response'],
                    'parameter_name' => 'deception_type',
                ]
            ],
            'signal' => [
                'exclude_signal' => [
                    'name' => 'Exclude Signal',
                    'options' => [], // list of other signals
                    'parameter_name' => 'signal'
                ]
            ],
            'rate_limit' => [
                'log_request' => [
                    'name' => 'Log Request',
                    'signal_match' => $rateLimitMatchTypes,
                    'other_signal_options' => [] // list of signal options for "Other Signal"
                ],
                'block_signal' => [
                    'name' => 'Block Signal',
                    'signal_match' => $rateLimitMatchTypes,
                    'other_signal_options' => [] // list of signal options for "Other Signal"
                ],
                'deception' => [
                    'name' => 'Deception',
                    'signal_match' => $rateLimitMatchTypes,
                    'other_signal_options' => [] // list of signal options for "Other Signal"
                ]
            ]
        ];
    }

    public function getRateLimitIdentifiers(array $workspaceSignals)
    {
        return [
            'ip' => [
                'name' => 'IP Address',
            ],
            'request_header' => [
                'name' => 'Request Header',
                'input_parameter_name' => 'name',
            ],
            'request_cookie' => [
                'name' => 'Request Cookie',
                'input_parameter_name' => 'name',
            ],
            'post_parameter' => [
                'name' => 'Post Parameter Value',
                'input_parameter_name' => 'name',
            ],
            'signal_payload' => [
                'name' => 'Signal Payload',
                'input_parameter_name' => 'signal',
                'options' => $workspaceSignals // Workspace Signals
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
}
