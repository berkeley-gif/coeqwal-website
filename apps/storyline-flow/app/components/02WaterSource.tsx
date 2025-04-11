import storyline from '../../public/locales/english.json' assert { type: "json" };
import SectionContainer from './helpers/SectionContainer';
import { Box, Typography } from '@repo/ui/mui';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';
import { useRef, useState, useEffect, useCallback } from 'react';
import { useMap } from '@repo/map';
import { stateMapViewState } from './helpers/mapViews';
import { labelVariants, motion } from '@repo/motion';

function SectionWaterSource() {
  return (
    <>
      <Precipitation />
    </>
  )
}

function Precipitation() {
    const content = storyline.precipitation
    const ref = useRef<HTMLDivElement>(null);
    //TODO: figure why this is needed after the research team meeting
    const [hasIntersected, setHasIntersected] = useState(false);
    const { flyTo, withMap } = useMap()
    const map = withMap((map) => map)

    const initFlyTo = useCallback(() => {
        if (map) {
            console.log('fly attempt 2')
            console.log('zoom should be 5.8', map.getZoom())
            flyTo(
                stateMapViewState.longitude,
                stateMapViewState.latitude,
                12,
                stateMapViewState.pitch,
                stateMapViewState.bearing,
            )
        }
    }, [map])

    useIntersectionObserver(
        ref,
        (isIntersecting) => {
            if (isIntersecting && !hasIntersected) {
                console.log("into view");
                initFlyTo()
                setHasIntersected(true);
            } else if (!isIntersecting && hasIntersected) {
                console.log("out of view");
                setHasIntersected(false);
            }
        },
        { threshold: 0.5 },
    );

    return (
        <SectionContainer id="variability">
            <Box ref={ref} className="container" height='90vh' sx={{justifyContent: 'center'}}>
                <Box className='paragraph'>
                    <motion.h6 variants={labelVariants} initial="hidden" whileInView="visible" custom={1}>Motion Testing</motion.h6>
                    <Typography variant="h2" gutterBottom>{content.title}</Typography>
                </Box>
                <Box className='paragraph'>
                    <Typography variant="body1">{content.p1}</Typography>
                    <Typography variant="body1">{content.p2}</Typography>
                </Box>
            </Box>
        </SectionContainer>
    )
}

export default SectionWaterSource
