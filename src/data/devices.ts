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
	Mobilephone: [
		{
			name: " iqoo neo 10",
			image: "/images/device/iqoo.webp",
			specs: "/ 16G+16G + 1TB",
			description:
				"Flagship performance, Hasselblad imaging, 80W SuperVOOC.",
			link: "https://www.vivo.com.cn/vivo/iqooneo10/",
		},
	],
	Computer: [
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
			specs: "M1/8GB/256GB/touch id",
			description:
				"代码剪辑机器，图书馆必备。"
			link:"https://support.apple.com/zh-cn/111883/",
		}
	],
};
