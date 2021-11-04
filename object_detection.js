let canvas, context;             // キャンバス
const image = new Image();      // 画像
let detectedObjectLabel = new Array();  // 検出した物体のラベル

const init = () => {
  // キャンバス
  canvas = document.getElementById("image");
  context = canvas.getContext("2d");
  // 「検出」ボタンを無効化
  document.getElementById("detectButton").disabled = true;
}

const loadImage = files => {
  // 画像の読み込み
  image.src = URL.createObjectURL(files[0]);
  image.onload = () => {
    // 画像を描画（縦横最大600px）
    let width, height, size = 600;
    if(image.width > image.height){
      [width, height] = [size, image.height/image.width * size];
    }else{
      [width, height] = [image.width/image.height * size, size];
    }

    [canvas.width, canvas.height] = [width, height];
    context.clearRect(0,0,width,height);
    context.drawImage(image,0,0,width,height);

    // 検出結果をクリア、「検出」ボタンを有効化
    document.getElementById("list").innerHTML = "";
    document.getElementById("message").innerText = "";
    document.getElementById("detectButton").disabled = false;
  }
}

const detect = () => {
  // 検出
  // 最少スコア
  const minScore = document.getElementById("min").value / 100;

  document.getElementById("list").innerHTML = "";
  detectedObjectLabel = [];

  const message = document.getElementById("message");
  message.innerText = "検出中...";

  cocoSsd.load().then(model => {
    // Coco SSD の読み込みが成功した場合、
    // 物体を検出
    model.detect(canvas, 100, minScore).then(predictions => {
      for(let i=0; i<predictions.length; i++){
        addObject(predictions[i]);
      }
      message.innerText += "完了";
      if(predictions.length == 0){
        message.innerText = "検出されませんでした。";
      }
    });
  });
}

const addObject = prediction => {
  // 検出した物体のラベルを追加
  if(detectedObjectLabel.indexOf(prediction.class) == -1){
    detectedObjectLabel.push(prediction.class);
    const label = document.createElement("div");
    label.innerText = prediction.class;
    label.className ="label";
    document.getElementById("list").appendChild(label);
    const object = document.createElement("div");
    object.id = prediction.class;
    document.getElementById("list").appendChild(object);
  }

  // 検出した情報を取得
  const [x, y, w, h] = prediction.bbox;
  const scale = image.width / canvas.width;
  const [x1, y1, w1, h1] = [x*scale, y*scale, w*scale, h*scale];
  const score = (prediction.score * 100).toFixed(2);
  // スコア
  const div = document.createElement("div");
  div.className = "block";

  const scoreDiv = document.createElement("div");
  scoreDiv.innerText = `(${score}%)`;
  div.appendChild(scoreDiv);

  // 画像
  const miniCanvas = document.createElement("canvas");
  const miniContext = miniCanvas.getContext("2d");
  let w2, h2, size = 100;
  if(w>h){
    [w2, h2] = [size.h/w*size];
  }else{
    [w2, h2] = [w/h*size, size];
  }
  miniCanvas.width = w2;
  miniCanvas.height = h2;
  miniContext.drawImage(image, x1, y1, w1, h1, 0, 0, w2, h2); // 検出した物体の画像を表示
  // マウスカーソルが入ったときに検出した矩形を描画
  miniCanvas.onmouseenter = () => {
    miniCanvas.classList.add("select");
    context.strokeStyle = "#00CCFF";
    context.lineWidth = 4;
    context.strokeRect(x, y, w, h);
  }
  // マウスカーソルが出たときに矩形を消去
  miniCanvas.onmouseleave = () => {
    miniCanvas.classList.remove("select");
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
  }
  div.appendChild(miniCanvas);
  document.getElementById(prediction.class).appendChild(div);
}