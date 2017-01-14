

var content;
if ($.request.body) {
	content = $.request.body.asString();
}

if (content === undefined) {
    $.response.contentType = "text/html";
	$.response.setBody("HTTP service request must have an Echo Speech Content Body");
	$.response.status = $.net.http.INTERNAL_SERVER_ERROR;
} else {
	var oBody = JSON.parse(content);
	var echoRequest = oBody.request;

	var intent = echoRequest.intent;

	var intentName = intent.name;
	var intentSlots = intent.slots;

	var sqlStatement;
	var sqlCursor;
	var loadProcedure;
	var speakerNotFound;
	var nextTrackNotFound;
	var result;
	var hanaResult;
	var resultSets;
	var echoResponse;
	//NextTrack What will be the next track after {speaker}
	//NextSpeaker Who will be the next speaker after {speaker}
	//TrackSpeaker Who will be the speaker of track {track}

	var speaker = 'Sebastian Wolf';
	if (intentSlots.hasOwnProperty("speaker")) {
		speaker = intentSlots["speaker"].value;
	}

	var conn = $.hdb.getConnection();
	switch (intentName) {
		case "NextSpeaker":
			loadProcedure = conn.loadProcedure('SITSPEECH', 'SITSPEECH.procedures::NextTrackAfterSpeaker');
			result = loadProcedure(speaker);
			speakerNotFound = result['speaker_not_found'];
			nextTrackNotFound = result['next_track_not_found'];
			if (speakerNotFound === 'X') {
				echoResponse = speaker + " doesn't have any sessions";
			} else if (speakerNotFound === 'X') {
				echoResponse = "there is no next speaker after " + speaker;
			} else {
				resultSets = result['$resultSets'];
				hanaResult = resultSets[0]["0"];
				echoResponse = "the next speaker is " + hanaResult.SPEAKER + " and the session title is " + hanaResult.TITLE;
			}
			break;
		case "NextTrack":
			//         sqlStatement = 'select * from "SITVOICE"."SITIOTVOICE.data::Entities.Details"';
			//         break;
		case "TrackSpeaker":
			//         sqlStatement = 'select * from "SITVOICE"."SITIOTVOICE.data::Entities.Details"';
			break;
		default:
			//         sqlStatement = undefined;
	}
	conn.close();

    // Echo needs a full text
	echoResponse = echoResponse.replace("&", " and ");
	echoResponse = echoResponse.replace("+", " plus ");
	echoResponse = echoResponse.replace("S/", " S for ");
	echoResponse = echoResponse.replace("&", " and ");

	var output = "{ \"version\":\"1.0\", \"response\":{ \"outputSpeech\":{ \"type\":\"PlainText\", " +
		"\"text\":\"" + echoResponse +
		"\" }, \"reprompt\":{ \"outputSpeech\":{ \"type\":\"PlainText\", \"text\":\"Hello " +
		" are you still there?\" } }, \"shouldEndSession\":true } }";

	//output = JSON.stringify(resultSets);

	$.response.setBody(output);

}