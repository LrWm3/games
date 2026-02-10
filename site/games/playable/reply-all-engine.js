// This file assumes 'reply-all-consts' has already been imported.
function ReplyAllRunEngine(initRunData) {
    // run state
    let replyAllRunState = initRunData
    let initialReplyAllRunState = initRunData
    // engine functions go here, no actual 
    return () => {
        init: () => {
            replyAllRunState = initialReplyAllRunState;
        }
        // TODO - other functions
    }
}