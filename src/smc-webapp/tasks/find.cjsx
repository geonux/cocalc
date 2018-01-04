###
Searching for tasks by full text search and done/deleted status.
###

{React, ReactDOM, rclass, rtypes}  = require('../smc-react')

{FormControl} = require('react-bootstrap')

{ShowToggle} = require('./show-toggle')

{EmptyTrash} = require('./empty-trash')

exports.Find = rclass
    propTypes:
        actions          : rtypes.object
        local_view_state : rtypes.immutable.Map
        counts           : rtypes.immutable.Map

    shouldComponentUpdate: (next) ->
        return @props.local_view_state != next.local_view_state or \
               @props.counts           != next.counts

    render_toggle: (type) ->
        count = @props.counts.get(type)
        show  = @props.local_view_state.get("show_#{type}")
        toggle = <ShowToggle
            actions = {@props.actions}
            type    = type
            show    = {show}
            count   = {count}
            />
        if show and type == 'deleted' and count > 0
            extra = <EmptyTrash actions={@props.actions} count={count} />
        else
            extra = undefined
        <div>
            {toggle}
            {extra}
        </div>

    render_search: ->
        <FormControl
            type           = 'text'
            ref            = 'search'
            componentClass = 'input'
            value          = {@props.local_view_state.get('search') ? ''}
            onChange       = {=>@props.actions.set_local_view_state(search: ReactDOM.findDOMNode(@refs.search).value)}
        />

    render: ->
        if not @props.actions? or not @props.local_view_state?
            return <span />
        <div style={float: 'right', padding: '10px'}>
            {@render_search()}
            {@render_toggle('done')}
            {@render_toggle('deleted')}
        </div>