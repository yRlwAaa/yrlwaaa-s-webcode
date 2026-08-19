import type { AlbumGroup } from "../../../types/album";

export interface AlbumCardProps {
	album: AlbumGroup;
}

export interface PhotoCardProps {
	src: string;
	thumbnail?: string;
	alt?: string;
	albumId: string;
}
