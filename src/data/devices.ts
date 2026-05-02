// 设备数据配置文件

export interface Device {
	name: string;
	image: string;
	specs: string;
	description: string;
	link: string;
}

// 设备类别类型，支持品牌和自定义类别
export type DeviceCategory = Record<string, Device[]> & {
	自定义?: Device[];
};

export const devicesData: DeviceCategory = {
	手机: [
		{
			name: " iqoo neo 10",
			image: "/images/device/iqoo.webp",
			specs: "16G+16G + 1TB",
			description:
				"Flagship performance, Hasselblad imaging, 80W SuperVOOC.",
			link: "https://www.vivo.com.cn/vivo/iqooneo10/",
		},
	],
	电脑: [
		{
			name: "ASUS TUF Gaming FX608JP",
			image: "/images/device/tx.png",
			specs: "i7-13650HX/16GB/1TB/RTX5070",
			description:
				"主力游戏机。",
			link: "https://www.asus.com.cn/laptops/for-gaming/tuf-gaming/asus-tuf-gaming-f16-2025/techspec/",
		},
		{
			name: "Macbook air M1",
			image: "/images/device/macbook.png",
			specs: "M1/8GB/256GB/Touch id",
			description:
				"代码剪辑机器，图书馆必备。",
			link:"https://support.apple.com/zh-cn/111883/",
		},
		{
			name:"Desktop PC",
			image:"images/device/pc.png",
			specs:"E52680v4/Samsung DDR4 8GB*2/Greatwall 128GB SSD,WD 4TB HDD/RX580 4GB/X99-C610/航嘉600w",
			description:" 第一台亲手diy的神机！高中以来从e31220v2+8GB内存+gtx650到现在的主机，他是我正式迈入信息世界的大门。",
		}
	],
	手环:[
		{
			name:"小米手环9 NFC 银色",
			image:"images/device/xm.png",
			specs:"NFC/1.69英寸AMOLED彩屏/电池容量233Mah/蓝牙5.4/重量15.8g/110种运动模式",
			description:"人生中第一个智能可穿戴设备，终于知道自己睡多久了。刷地铁太方便啦！！",
			link:"https://www.mi.com/prod/xiaomi-shouhuan-9-nfc/specs"
		}
	]

};
