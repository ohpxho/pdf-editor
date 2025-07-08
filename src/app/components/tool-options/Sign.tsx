import { ImageAnnotation, TextAnnotation } from '@/app/types/types'
import { PDFContext } from '@/app/PDFEditor'
import { Plus, Brush, Type, Image, RotateCcw, Trash2 } from 'lucide-react'
import ColorPicker from '@/components/ui/color-picker'
import Img from "next/image"
import { useState, useRef, useEffect, useCallback, ChangeEvent, useContext} from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import PenWeightSlider from "@/components/ui/pen-weight-slider"
import { Stage, Layer, Text, Line, Image as KImage, Rect, Group} from 'react-konva'
import Konva from 'konva'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
  } from "@/components/ui/select"
import { generateNumericId } from '@/lib/main'

  
const fonts = [
  { name: 'Alex Brush', css: "'Alex Brush', cursive" },
  { name: 'Dancing Script', css: "'Dancing Script', cursive" },
  { name: 'Great Vibes', css: "'Great Vibes', cursive" },
  { name: 'Pacifico', css: "'Pacifico', cursive" },
  { name: 'Sacramento', css: "'Sacramento', cursive" }
];

export default function Sign() {
    const pdf = useContext(PDFContext);
    const stageRef = useRef<Konva.Stage | null>(null)
    const layerRef = useRef<Konva.Layer | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const drawConRef = useRef<HTMLDivElement | null>(null)
    const [width, setWidth] = useState<number>(80)
    const [color, setColor] = useState<string>("#000")
    const [open, setOpen] = useState<boolean>(false)
    const [tab, setTab] = useState("draw")
    const [lines, setLines] = useState<Array<{ points: number[] }>>([])
    const [strokeWidth, setStrokeWidth] = useState<number>(5)
    const [isDrawing, setIsDrawing] = useState<boolean>(false)
    const [imageDataURL, setImageDataURL] = useState<string>("")
    const [imageObj, setImageObj] = useState<HTMLImageElement | null>(null)
    const [text, setText] = useState<string>()
    const [selectedFont, setSelectedFont] = useState<string>("")
    const [isDisabled, setIsDisabled] = useState<boolean>(true)

    const clearStageStates = ():void => {
        setLines([])
        setText("")
        setImageDataURL("")
        setImageObj(null)
    }

    useEffect(() => {
        if(!fonts[0].name) return

        setSelectedFont(fonts[0].name)
    }, [setSelectedFont])

    useEffect(() => {
        clearStageStates() 

        if (open) {
          setTimeout(() => {
            if (drawConRef.current) {
              setWidth(drawConRef.current.clientWidth);
            }
          }, 0);
        }
    }, [open, tab])
      
    useEffect(() => {
        if(text || lines.length > 0 || imageObj) {
            setIsDisabled(false)
        } else {
            setIsDisabled(true)
        }
    }, [text, lines, imageObj])
    
    
    useEffect(() => {
        if(!imageDataURL) return
        
        const img = new window.Image();
        img.src = imageDataURL
        img.onload = () => {
            setImageObj(img)
        }
    }, [imageDataURL])

    const onTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
       if(tab !== "write") return
       
       setText(e.target.value)
    }

    const onSignatureUpload = useCallback((src: string):void => {
        if(!src || !pdf) return

        const img = new window.Image();
        img.src = src

        img.onload = () => {
            const width = img.width            
            const height = img.height
            
            const stageWidth = pdf.stageRef?.width() || 0;
            const stageHeight  = pdf.stageRef?.height() || 0;
            
            const newSignAnnotation: ImageAnnotation = {
                id: generateNumericId(),
                x: stageWidth / 2 - width /2,
                y: stageHeight / 2 - height / 2,
                scaleX: 1,
                scaleY: 1,
                skewX: 0,
                skewY: 0,
                width,
                height,
                src: src
            }
            
            if(!pdf) return
            const pageNo = pdf.currPageInView + 1
            const type = 'signature'
            pdf.addPageAnnotations(pageNo, newSignAnnotation, type)
            pdf.updateSelectedAnnotation(newSignAnnotation.id)
        }
    }, [pdf])

    
    const onMouseDown = useCallback(() => {
        if(tab !== "draw") return;
        if(!stageRef.current) return;
        setIsDrawing(true)
        const pos = stageRef.current.getPointerPosition();
        if(!pos) return;
        setLines([...lines, { points: [pos.x, pos.y] }]);
    }, [lines, tab]);
    
    const onMouseMove = useCallback(() => {
        if(tab !== "draw" || !isDrawing) return
        if(!stageRef.current) return

        const pos = stageRef.current.getPointerPosition();
        const lastLine = lines[lines.length - 1];
        if(!pos || !lastLine) return
        lastLine.points = lastLine.points.concat([pos.x, pos.y]);

        lines.splice(lines.length - 1, 1, lastLine);
        setLines(lines.concat());
    }, [isDrawing, lines, tab]);
    
    const onMouseUp = () => {
        setIsDrawing(false)
    }
    
    const onFileChange = (e: ChangeEvent<HTMLInputElement> ):void => {
        const file = e.target.files![0] 
        if(!file) return

        const reader = new FileReader();
        reader.onload = (event: ProgressEvent<FileReader>) => {
            if(event.target?.result) {
                setImageDataURL(event.target.result as string)
            }
        }
        
        reader.readAsDataURL(file)
    }
    
    const handleExport = ():void => {
        if(!stageRef.current || !pdf) return 
        const stage = stageRef.current;
        const layer = stage.getLayers()[0];

        const box = layer.getClientRect({ skipTransform: false, skipShadow: false})
        
        const dataUrl = stage.toDataURL({
            x: box.x,
            y: box.y,
            width: box.width,
            height: box.height,
            pixelRatio: 2,
            mimeType: "image/png"
        })

        pdf.addSignature(dataUrl)
        
        clearStageStates()
    }
    
    const handleRemoveSignature = (index: number): void => {
        if(!pdf) return
        
        pdf.removeSignature(index)
    }

    return (
        <div className="w-full flex flex-col gap-4">
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                    <Button
                        className="flex w-full items-center justify-center gap-4 border border-gray-300 rounded-sm px-4 py-2 bg-white cursor-pointer hover:bg-blue-100 hover:border-blue-600 transition-colors shadow-sm text-black hover:text-blue-600"
                    >
                        <Plus />
                        <span className="font-medium">Create signature</span>
                    </Button>
                </DialogTrigger>
                <DialogContent className="p-0 !w-full !max-w-xl ">
                    <div className="border-b px-6 py-4 mb-6">
                        <DialogTitle className="text-base font-medium">Create signature</DialogTitle>
                    </div>

                  <div className="relative flex flex-col px-6 ">
                    <Tabs value={tab} onValueChange={setTab} defaultValue='draw' className="relative flex items-center w-full">
                        <TabsList className="w-xs h-fit mb-2 bg-transparent">
                            <TabsTrigger value="draw" className="flex flex-col text-gray-500 hover:text-black cursor-pointer data-[state=active]:text-blue-600 items-center gap-1 p-2 h-full data-[state=active]:shadow-none data-[state=active]:bg-blue-100 justify-center">
                                <Brush />
                                <span className="text-xs">Draw</span>
                            </TabsTrigger>
                            <TabsTrigger value="write" className="flex text-gray-500 flex-col hover:text-black items-center gap-1 h-full justify-center cursor-pointer data-[state=active]:text-blue-600 data-[state=active]:shadow-none p-2 data-[state=active]:bg-blue-100">
                                <Type />
                                <span className="text-xs">Write signature</span>
                            </TabsTrigger>
                            <TabsTrigger value="image" className="flex flex-col text-gray-500 hover:text-black items-center gap-1 h-full justify-center cursor-pointer data-[state=active]:text-blue-600 data-[state=active]:shadow-none p-2 data-[state=active]:bg-blue-100">
                                <span>
                                    <Image />
                                </span>
                                <span className="text-xs">Use image</span>
                            </TabsTrigger>
                        </TabsList>

                        <div className="flex flex-col gap-0 w-full"> 
                        <TabsContent value="draw" className="w-full shadow-none bg-gray-100 rounded-none">
                            <Card className="w-full rounded-none bg-gray-50 shadow-none py-2">
                                <CardContent className="w-full">
                                   <div className="flex w-full items-center justify-between gap-4">
                                        <div className="flex">
                                            <ColorPicker color={color} setColor={setColor}/>
                                            <div className="flex gap-2 w-full">
                                                <PenWeightSlider strokeWidth={strokeWidth} setStrokeWidth={setStrokeWidth}/>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            className="p-0 m-0 border-none bg-transparent shadow-none hover:bg-transparent focus:outline-none cursor-pointer"
                                            onClick={() => {
                                                setLines([])
                                            }}
                                            aria-label="Restart drawing"
                                        >
                                            <RotateCcw className='w-4'/>
                                        </button>
                                    </div> 
                                    
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="write" className="w-full shadow-none bg-gray-100 rounded-none">
                            <Card className="w-full rounded-none bg-gray-100 shadow-none py-2">
                                <CardContent>
                                    <div className="flex w-full items-center justify-between gap-4">
                                        <div className="flex gap-2 ">
                                            <ColorPicker color={color} setColor={setColor}/>
                                            <Select value={selectedFont} onValueChange={setSelectedFont}>
                                              <SelectTrigger className="bg-white w-[180px]">
                                                <SelectValue placeholder="Select a signature" />
                                              </SelectTrigger>
                                              <SelectContent>
                                                <SelectGroup>
                                                    <SelectLabel>Signature</SelectLabel>
                                                    {fonts.map((font) => (
                                                        <SelectItem key={font.name} value={font.name}>
                                                            <span style={{ fontFamily: font.css }} className="text-lg">
                                                                {font.name}
                                                            </span>
                                                        </SelectItem>
                                                    ))} 
                                                </SelectGroup>
                                              </SelectContent>
                                            </Select> 
                                            <Input type="text" className="bg-white" placeholder="Write your signature here..." onChange={onTextChange}/>
                                        </div>
                                    </div> 
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {!imageDataURL?
                            (<TabsContent value="image" className="relative flex items-center justify-center w-full !h-[256] bg-red-100 shadow-none z-10">
                                <Card className="absolute top-0 bg-transparent shadow-none py-2 border-none  h-[256] flex items-center justify-center" >
                                    <CardContent>
                                        <div className="flex justify-center items-center w-full">
                                            <label className="flex flex-col items-center gap-2 p-12 text-gray-700 rounded-lg cursor-pointer transition-colors border-3 border-dashed border-gray-400 hover:border-gray-600">
                                                <Image strokeWidth={1} />
                                                <span className="text-sm">Upload Image</span>
                                                <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={onFileChange} />
                                            </label>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>) :
                            (<TabsContent value="image" className="w-full shadow-none bg-gray-100 rounded-none">
                                <Card className="w-full flex items-end rounded-none bg-gray-100 shadow-none py-2">
                                    <CardContent>
                                        <button
                                            type="button"
                                            className="p-0 m-0 border-none bg-transparent shadow-none hover:bg-transparent focus:outline-none cursor-pointer"
                                            onClick={() => {
                                                setImageDataURL("")
                                                setImageObj(null)
                                            }}
                                            aria-label="Restart drawing"
                                        >
                                            <RotateCcw className='w-4'/>
                                        </button>
                                    </CardContent>
                                </Card>
                            </TabsContent>)
                        }
                        
                        <div ref={drawConRef} className="w-full h-[256]">
                             <SignStage
                                stageWidth={width}
                                stageRef={stageRef}
                                layerRef={layerRef}
                                lines={lines}
                                image={imageObj}
                                text={text}
                                lineStyle={{
                                    color: color,
                                    strokeWidth: strokeWidth
                                }}
                                fontStyle={{
                                    color: color,
                                    fontFamily: selectedFont
                                }}
                                mode={tab}
                                onMouseDown={onMouseDown}
                                onMouseMove={onMouseMove}
                                onMouseUp={onMouseUp}
                             
                             />           
                        </div>
                        </div>
                    </Tabs>
                    </div>

                  <div className="flex justify-between items-center border-t px-6 py-4 bg-gray-50">
                    <DialogClose asChild>
                      <Button variant="outline" className="w-32">Cancel</Button>
                    </DialogClose>
                    <DialogClose asChild>
                      <Button
                        disabled={isDisabled ? true : false}
                        className={`w-48 ${isDisabled ? 'cursor-not-allowed bg-gray-200 text-gray-500' : 'bg-black text-white'}`}
                        onClick={handleExport}
                      >
                        Create and use
                      </Button>
                    </DialogClose>
                  </div>
                </DialogContent>
            </Dialog>
            <div className="relative flex flex-col gap-4 mt-6 items-center">
                {
                    pdf && pdf.signatures.map((signature, i) => {
                        return (
                            <div
                                key={i}
                                className="group relative hover:border-2 hover:border-blue-600 transition-colors"
                                onClick={() => onSignatureUpload(signature)}
                            >
                                <div 
                                    className="absolute hidden group-hover:block cursor-pointer -right-3 -top-3 rounded-full text-white bg-blue-600 p-1" 
                                    onClick={(e) => { 
                                        e.stopPropagation();
                                        handleRemoveSignature(i)
                                    }}>
                                    <Trash2 className="h-4 w-4" />
                                </div>
                                <Img
                                    width={120}
                                    height={120}
                                    className="h-auto"
                                    key={i}
                                    src={signature}
                                    alt="Signature"
                                />
                            </div>
                        )
                    })
                }
            </div>
        </div>
    )
}

interface SignStageProps {
    stageWidth: number;
    stageRef: React.RefObject<Konva.Stage | null>;
    layerRef: React.RefObject<Konva.Layer | null>;
    lines: Array<{points: number[]}>;
    image: HTMLImageElement | null;
    text: string | undefined;
    lineStyle: {
        color: string,
        strokeWidth: number
    };
    mode: string;
    fontStyle: {
        color: string,
        fontFamily: string
    }
    onMouseDown: () => void;
    onMouseMove: () => void;
    onMouseUp: () => void;
}

const SignStage = ({
    stageWidth,
    stageRef, 
    layerRef,
    lines,
    image,
    text,
    mode,
    lineStyle,
    fontStyle,
    onMouseDown, 
    onMouseMove, 
    onMouseUp, 
    
    }: SignStageProps) => {
    const textRef = useRef<Konva.Text>(null) 
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const imageRef = useRef<Konva.Image>(null)
    
    useEffect(() => {
        const textNode = textRef.current
        const imageNode = imageRef.current
        let width = 0
        let height = 0
        
        if(textNode) {
          width = textNode.width();
          height = textNode.height();
        } else if(imageNode) {
          width = imageNode.width();
          height = imageNode.height();  
        }

        setPosition({
            x: (stageWidth - width) / 2,
            y: (256 - height) / 2,
        });
    }, [stageWidth, text, image]);

    return (
        <Stage 
            className="w-fit bg-gray-300 z-10"
            height={256}
            width={stageWidth}
            ref={stageRef}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
        >
            <Layer ref={layerRef}>
                {
                    mode == "draw" && lines.map((line, i) => {
                        return (
                        <Line
                            key={i}
                            points={line.points}
                            stroke={lineStyle.color}
                            strokeWidth={lineStyle.strokeWidth}
                            tension={0.5}
                            lineCap="round"
                            lineJoin="round"
                        />)
                    })
                }
                {
                    mode == "write" && (
                        <Text
                            ref={textRef}
                            x={position.x}
                            y={position.y}
                            fontSize={32}
                            fill={fontStyle.color}
                            fontFamily={fontStyle.fontFamily}
                            text={text}
                        />
                    )
                }
                {
                    mode == "image" && image && (
                        <KImage
                            ref={imageRef}
                            image={image}
                            width={Math.min(200, image.width)}
                            height={Math.min(200, image.height)}
                            x={position.x}
                            y={position.y}
                        />
                    )
                }
            </Layer>
        </Stage>
    )
}