function sketch(P, sectorNames) {

  var cx, cy, diameter, responseValue,
      dragIdx, zAngle,
      zenith = -90,
      angles = [],
	  nSectors = sectorNames.length,
      extractSectorModel = function (){
        var idx, tally,
            model = [zenith],
            ar = eval('(' + responseValue + ')');

        for(idx = 0, tally = zenith; idx < ar.length; idx += 1){
          model.push(tally += ar[idx]);
        }

        return model;
      },
      extractCircumPointsModel = function(midAngle, extended){
        var idx,
            angleTally = 0,
            model = [],
            getCircumPoint = function(angle){
              var a = (angle % 90) ? angle % 90 : 90,
                  q = Math.floor((angle / 90) + ((angle % 90) ? 1 : 0)),
                  r = (extended ? (diameter / 2) * 1.38 : diameter / 2),
                  p = P.radians(a);
                  s = r * Math.sin(p),
                  c = r * Math.cos(p),
                  point = [];

              if      (q === 4) { point[0] = cx - c;  point[1] = cy - s; }
              else if (q === 3) { point[0] = cx - s;  point[1] = cy + c; }
              else if (q === 2) { point[0] = cx + c;  point[1] = cy + s; }
              else if (q === 1) { point[0] = cx + s;  point[1] = cy - c; }

			  //console.log('angle: '+angle+', a: '+a+', q: '+q+', r: '+r+', p: '+p+', s: '+s+', c: '+c+', point: ' + point)
              return point;
            };

        for (idx = 0; idx < nSectors; idx += 1){
          var a = angleTally += (midAngle
									? ((idx === 0) 
											? (angles[idx] / 2) 
											: ((angles[idx - 1] / 2) + (angles[idx] / 2)))
									: angles[idx]);
							
		  a = a + zenith + 90;
		  a = (a > 360) ? a - 360 : (a < 0) ? a + 360 : (a === 0) ? 360 : a;
          model[idx] = getCircumPoint(a);
		  //console.log(model);
	    }

        return model;
      },
	  getMouseAngleFromZenith = function(){
		var x, y, a, r, q,
			px = P.mouseX,
			py = P.mouseY;

		if (dragIdx !== undefined){
		  x = (px > cx) ? px - cx : cx - px;
		  y = (py > cy) ? py - cy : cy - py;
  		  q = ((py >= cy) ?	((px >= cx) ? 1 : 2) : ((px >= cx) ? 0 : 3));
		  r = (q % 2) ? (y / x) : (x / y);
		  a = Math.floor(P.degrees(Math.atan(r))) + (q * 90); 
		}
		
		return a;
	  };

  P.setup = function(){
    var idx, tally = 0, a = 0,
        //fontList = P.PFont.list(),
        font = P.createFont("serif", 10);
    
    P.size(300,300);
    cx = Math.round(P.width / 2);
    cy = Math.round(P.height / 2);
    diameter = P.width * 0.62;
    a = Math.round(360 / nSectors);
    for (idx = 0; idx < nSectors; idx+=1){
      angles[idx] = (idx > nSectors - 2) ? (360 - tally) : a;
      tally += a;
    }
    
    P.colorMode(P.HSB, 256);
    P.background(125);
    P.textFont(font); 

    P.noLoop();

    responseValue = '[' + angles.toString() + ']';
  };

  P.draw = function() {
    var idx, start, end, outerPoint, innerPoint,
       sectorModel = extractSectorModel(),
       dragHandlerModel = extractCircumPointsModel(),
       innerAngleIndicatorModel = extractCircumPointsModel(midAngle = true),
       outerAngleIndicatorModel = extractCircumPointsModel(midAngle = true, extended = true);

    P.fill(P.color(0, 0, 255));
    P.rect(0,0,P.width,P.height);

    // draw sectors
    for (idx = 0; idx < nSectors; idx += 1){
      P.fill(P.color((256 / nSectors) * idx, 200, 128));

      start = sectorModel[idx];
      end = sectorModel[idx + 1];

      P.arc(cx, cy, diameter, diameter, P.radians(start), P.radians(end));
    }
    // draw angle indicators
    for (idx = 0; idx < nSectors; idx += 1){
      outerPoint = outerAngleIndicatorModel [idx];
	  innerPoint = innerAngleIndicatorModel [idx];
      P.stroke(80, 80, 80);
      P.line(innerPoint[0], innerPoint[1], outerPoint[0], outerPoint[1]);
      P.fill(0);
	  //P.textAlign(CENTER);
      P.text(sectorNames[idx] + ":  " + angles[idx], outerPoint[0] - 30, outerPoint[1] - 5);
	}
    // draw drag handles
    for (idx = 0; idx < nSectors; idx += 1){
      outerPoint = dragHandlerModel[idx];
      P.stroke(0);
      P.line(cx, cy, outerPoint[0],outerPoint[1]);
      P.fill(P.color((256 / nSectors) * idx, 200, 128));
      P.ellipse(outerPoint[0],outerPoint[1],10,10);
    }
  };

  P.mousePressed = function(){
    var idx, x, y, dx, dy, handle,
        px = P.mouseX,
        py = P.mouseY,
        dragging = false,
        dragHandlerModel = extractCircumPointsModel();

    for (idx = 0; idx < dragHandlerModel.length; idx += 1){
      handle = dragHandlerModel[idx];
      x = handle[0];
      y = handle[1];
      dx = (px > x) ? px - x : x - px;
      dy = (py > y) ? py - y : y - py;

      if (Math.sqrt((dx * dx) + (dy * dy)) < 5){
        dragging = true;
        break;
      }
    }

    dragIdx = dragging ? idx : undefined;
	zAngle = getMouseAngleFromZenith();
  };

  P.mouseDragged = function(){
    var a, da, n1, n2;
	
    if (dragIdx !== undefined){
      a = getMouseAngleFromZenith();
      da = a - zAngle;
	  da = ((Math.abs(da) > 180) ? ((da < 0) ? 360 + da : 360 - da) : da); 
		
      n1 = angles[dragIdx] + da;
      n2 = (dragIdx < angles.length - 1) ?
                angles[dragIdx + 1] - da :
                angles[0] - da;
		
      if (n1 > 3 && n2 > 3){ // prevent excessive handles overlap
        angles[dragIdx] = n1;
        if (dragIdx < angles.length - 1) {
          angles[dragIdx + 1] = n2;
        } else {
          angles[0] = n2;
          zenith += da;
        }

        zAngle = a;
        responseValue = '[' + angles.toString() + ']';
      }

      P.loop();
    } else {
      P.noLoop();
    }
  };

  P.mouseReleased = function(){
    dragIdx = undefined;
    P.noLoop();
  };
}


var p = new Processing(document.getElementById('pieChart'),
                       function(processing){ 
                         return sketch(processing, ["Jobs",
                                                    "Services",
                                                    "Cash",
                                                    "Stocks",
                                                    "Shares",
                                                    "Bonds",
                                                    "Gilts"]);
                       });
